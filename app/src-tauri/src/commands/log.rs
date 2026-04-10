//! Log file commands — the Rust side of the morning-ritual substrate.
//!
//! This module is the ONLY code in the Rust backend that touches the log
//! directory. Every path that resolves into `~/Documents/morning-ritual-log/`
//! goes through `ritual_log_dir`, so when Tauri Mobile lands the mobile
//! sandboxing story is a one-function change, not a scattered search-and-replace.
//!
//! The structure separates Tauri command wrappers (which resolve the log
//! directory from an `AppHandle`) from pure `_impl` functions that take a
//! `&Path`. The impl functions are unit-tested directly with a `TempDir`,
//! sidestepping Tauri's menu system entirely — unit tests never construct
//! an `App`, which would otherwise panic on macOS when run off the main
//! thread (muda::MenuChild).
//!
//! Contract surface:
//! - `read_day(date)` — read a single day's markdown file, empty if missing
//! - `append_section(date, slot, body)` — append a `## <slot>` section
//! - `grep_logs(pattern, dates)` — walk the given dates and return hits
//!
//! See plan-morning-ritual.md §10, §12, §15 for the rationale.

use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager, Runtime};
use thiserror::Error;

/// Directory under `$DOCUMENT` where logs live. The one place this name is
/// hard-coded in the Rust tree.
const LOG_DIR_NAME: &str = "morning-ritual-log";

#[derive(Debug, Error, Serialize)]
#[serde(tag = "kind", content = "message")]
pub enum LogError {
    #[error("io: {0}")]
    Io(String),
    #[error("log directory not available: {0}")]
    NoLogDir(String),
    #[error("invalid argument: {0}")]
    Invalid(String),
}

impl From<std::io::Error> for LogError {
    fn from(e: std::io::Error) -> Self {
        LogError::Io(e.to_string())
    }
}

/// The single path resolver. Returns `$DOCUMENT/morning-ritual-log` on
/// desktop. When Tauri Mobile lands for this project, this function grows
/// one `if cfg!(mobile)` branch to point at `$APPDATA/log` on iOS/Android,
/// and nothing else changes.
pub fn ritual_log_dir<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, LogError> {
    let documents = app
        .path()
        .document_dir()
        .map_err(|e| LogError::NoLogDir(format!("document dir: {e}")))?;
    Ok(documents.join(LOG_DIR_NAME))
}

// -- Tauri command wrappers ----------------------------------------------

#[tauri::command]
pub fn read_day<R: Runtime>(
    app: AppHandle<R>,
    date: String,
) -> Result<String, LogError> {
    let log_dir = ritual_log_dir(&app)?;
    read_day_impl(&log_dir, &date)
}

#[tauri::command]
pub fn append_section<R: Runtime>(
    app: AppHandle<R>,
    date: String,
    slot: String,
    body: String,
) -> Result<(), LogError> {
    let log_dir = ritual_log_dir(&app)?;
    append_section_impl(&log_dir, &date, &slot, &body)
}

#[tauri::command]
pub fn grep_logs<R: Runtime>(
    app: AppHandle<R>,
    pattern: String,
    dates: Vec<String>,
) -> Result<Vec<LogHit>, LogError> {
    let log_dir = ritual_log_dir(&app)?;
    grep_logs_impl(&log_dir, &pattern, &dates)
}

/// A hit from `grep_logs`: the date of the file, the line that matched, and
/// the `## <section>` header the line lived under (if any). The frontend
/// uses `date` for recency and `line` for the whisper text.
#[derive(Debug, Serialize, Deserialize)]
pub struct LogHit {
    pub date: String,
    pub line: String,
    pub section: Option<String>,
}

// -- Pure impls (no Tauri types, fully unit-testable) --------------------

fn read_day_impl(log_dir: &Path, date: &str) -> Result<String, LogError> {
    validate_date(date)?;
    let path = log_dir.join(format!("{date}.md"));
    if !path.exists() {
        return Ok(String::new());
    }
    Ok(fs::read_to_string(&path)?)
}

fn append_section_impl(
    log_dir: &Path,
    date: &str,
    slot: &str,
    body: &str,
) -> Result<(), LogError> {
    validate_date(date)?;
    validate_slot_name(slot)?;

    fs::create_dir_all(log_dir)?;
    let path = log_dir.join(format!("{date}.md"));
    let first_write = !path.exists();

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)?;

    if first_write {
        writeln!(file, "# {}", human_date(date))?;
        writeln!(file)?;
    }

    writeln!(file, "## {slot}")?;
    writeln!(file)?;
    writeln!(file, "{}", body.trim_end())?;
    writeln!(file)?;
    file.flush()?;
    Ok(())
}

/// Pattern is a plain substring search. Regex was skipped: the whisper
/// feature doesn't need it and adding a dep is a complexity tax we can
/// defer. If the day-7 moment ever needs word boundaries, bring in `regex`
/// then, not pre-emptively.
fn grep_logs_impl(
    log_dir: &Path,
    pattern: &str,
    dates: &[String],
) -> Result<Vec<LogHit>, LogError> {
    if pattern.is_empty() {
        return Err(LogError::Invalid("empty pattern".into()));
    }

    let mut hits = Vec::new();
    for date in dates {
        validate_date(date)?;
        let path = log_dir.join(format!("{date}.md"));
        if !path.exists() {
            continue;
        }
        let content = fs::read_to_string(&path)?;
        if let Some(hit) = first_match(&content, pattern, date) {
            hits.push(hit);
        }
    }

    Ok(hits)
}

// -- validation and helpers ----------------------------------------------

fn validate_date(date: &str) -> Result<(), LogError> {
    if date.len() != 10 {
        return Err(LogError::Invalid(format!("bad date: {date}")));
    }
    let bytes = date.as_bytes();
    if bytes[4] != b'-' || bytes[7] != b'-' {
        return Err(LogError::Invalid(format!("bad date: {date}")));
    }
    for (i, b) in bytes.iter().enumerate() {
        if i == 4 || i == 7 {
            continue;
        }
        if !b.is_ascii_digit() {
            return Err(LogError::Invalid(format!("bad date: {date}")));
        }
    }
    Ok(())
}

fn validate_slot_name(slot: &str) -> Result<(), LogError> {
    if slot.is_empty() {
        return Err(LogError::Invalid("empty slot name".into()));
    }
    if slot.contains('\n') || slot.contains('/') || slot.contains('\\') {
        return Err(LogError::Invalid(format!("bad slot name: {slot}")));
    }
    Ok(())
}

/// Render a YYYY-MM-DD string as "Friday, April 10, 2026" without pulling
/// in chrono. Does weekday calculation via Zeller's congruence.
fn human_date(iso: &str) -> String {
    let year: i32 = match iso[0..4].parse() {
        Ok(y) => y,
        Err(_) => return iso.to_string(),
    };
    let month: u32 = match iso[5..7].parse() {
        Ok(m) => m,
        Err(_) => return iso.to_string(),
    };
    let day: u32 = match iso[8..10].parse() {
        Ok(d) => d,
        Err(_) => return iso.to_string(),
    };

    let month_name = match month {
        1 => "January",
        2 => "February",
        3 => "March",
        4 => "April",
        5 => "May",
        6 => "June",
        7 => "July",
        8 => "August",
        9 => "September",
        10 => "October",
        11 => "November",
        12 => "December",
        _ => return iso.to_string(),
    };

    let weekday = weekday_name(year, month, day);
    format!("{weekday}, {month_name} {day}, {year}")
}

fn weekday_name(year: i32, month: u32, day: u32) -> &'static str {
    let (y, m) = if month < 3 {
        (year - 1, month + 12)
    } else {
        (year, month)
    };
    let k = y % 100;
    let j = y / 100;
    let h = (day as i32
        + (13 * (m as i32 + 1)) / 5
        + k
        + k / 4
        + j / 4
        + 5 * j)
        % 7;
    match h {
        0 => "Saturday",
        1 => "Sunday",
        2 => "Monday",
        3 => "Tuesday",
        4 => "Wednesday",
        5 => "Thursday",
        6 => "Friday",
        _ => "Unknown",
    }
}

/// First line matching `pattern`, with the current `## <section>` tracked
/// so the whisper can name where in the day's writing the line came from.
fn first_match(content: &str, pattern: &str, date: &str) -> Option<LogHit> {
    let mut current_section: Option<String> = None;
    for line in content.lines() {
        if let Some(rest) = line.strip_prefix("## ") {
            current_section = Some(rest.trim().to_string());
            continue;
        }
        if line.contains(pattern) {
            return Some(LogHit {
                date: date.to_string(),
                line: line.trim().to_string(),
                section: current_section.clone(),
            });
        }
    }
    None
}

// -- tests ----------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn validate_date_accepts_iso() {
        assert!(validate_date("2026-04-10").is_ok());
        assert!(validate_date("1999-12-31").is_ok());
    }

    #[test]
    fn validate_date_rejects_bad_input() {
        assert!(validate_date("").is_err());
        assert!(validate_date("2026-4-10").is_err());
        assert!(validate_date("10-04-2026").is_err());
        assert!(validate_date("2026/04/10").is_err());
        assert!(validate_date("not-a-date").is_err());
    }

    #[test]
    fn validate_slot_name_rules() {
        assert!(validate_slot_name("dreams").is_ok());
        assert!(validate_slot_name("inner-weather").is_ok());
        assert!(validate_slot_name("").is_err());
        assert!(validate_slot_name("has/slash").is_err());
        assert!(validate_slot_name("has\nnewline").is_err());
    }

    #[test]
    fn human_date_renders_friday_april_10() {
        assert_eq!(human_date("2026-04-10"), "Friday, April 10, 2026");
        assert_eq!(human_date("2026-01-01"), "Thursday, January 1, 2026");
    }

    #[test]
    fn first_match_captures_section() {
        let content = "# Friday\n\n## dreams\n\nI dreamed of the sea.\n\n## piano\n\nWorked on Chopin.\n";
        let hit = first_match(content, "sea", "2026-04-10").unwrap();
        assert_eq!(hit.line, "I dreamed of the sea.");
        assert_eq!(hit.section, Some("dreams".into()));
    }

    #[test]
    fn first_match_returns_none_when_absent() {
        let content = "# Day\n\n## dreams\n\nNothing.\n";
        assert!(first_match(content, "nonexistent", "2026-04-10").is_none());
    }

    #[test]
    fn read_day_impl_empty_when_missing() {
        let tmp = TempDir::new().unwrap();
        let result = read_day_impl(tmp.path(), "2026-04-10").unwrap();
        assert_eq!(result, "");
    }

    #[test]
    fn append_section_impl_creates_file_with_header() {
        let tmp = TempDir::new().unwrap();
        append_section_impl(tmp.path(), "2026-04-10", "dreams", "I dreamed of the sea.").unwrap();

        let content = fs::read_to_string(tmp.path().join("2026-04-10.md")).unwrap();
        assert!(content.starts_with("# Friday, April 10, 2026"));
        assert!(content.contains("## dreams"));
        assert!(content.contains("I dreamed of the sea."));
    }

    #[test]
    fn append_section_impl_adds_to_existing_file() {
        let tmp = TempDir::new().unwrap();
        append_section_impl(tmp.path(), "2026-04-10", "dreams", "First section.").unwrap();
        append_section_impl(tmp.path(), "2026-04-10", "piano", "Second section.").unwrap();

        let content = fs::read_to_string(tmp.path().join("2026-04-10.md")).unwrap();
        assert_eq!(content.matches("# Friday, April 10, 2026").count(), 1);
        assert!(content.contains("## dreams"));
        assert!(content.contains("## piano"));
        assert!(content.contains("First section."));
        assert!(content.contains("Second section."));
    }

    #[test]
    fn grep_logs_impl_finds_hit_with_section() {
        let tmp = TempDir::new().unwrap();
        append_section_impl(tmp.path(), "2026-04-09", "dreams", "A dream about the sea.").unwrap();
        append_section_impl(tmp.path(), "2026-04-10", "piano", "No sea today.").unwrap();

        let hits = grep_logs_impl(
            tmp.path(),
            "sea",
            &["2026-04-10".to_string(), "2026-04-09".to_string()],
        )
        .unwrap();

        assert_eq!(hits.len(), 2);
        assert_eq!(hits[0].date, "2026-04-10");
        assert_eq!(hits[0].section.as_deref(), Some("piano"));
        assert_eq!(hits[1].date, "2026-04-09");
        assert_eq!(hits[1].section.as_deref(), Some("dreams"));
    }

    #[test]
    fn grep_logs_impl_skips_missing_days() {
        let tmp = TempDir::new().unwrap();
        append_section_impl(tmp.path(), "2026-04-10", "dreams", "real content").unwrap();

        let hits = grep_logs_impl(
            tmp.path(),
            "content",
            &[
                "2026-04-08".to_string(),
                "2026-04-09".to_string(),
                "2026-04-10".to_string(),
            ],
        )
        .unwrap();

        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].date, "2026-04-10");
    }

    #[test]
    fn grep_logs_impl_rejects_empty_pattern() {
        let tmp = TempDir::new().unwrap();
        let err = grep_logs_impl(tmp.path(), "", &["2026-04-10".to_string()]).unwrap_err();
        assert!(matches!(err, LogError::Invalid(_)));
    }
}
