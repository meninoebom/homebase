// Tauri command modules. Each sub-module exposes #[tauri::command] functions
// that are registered in lib.rs via tauri::generate_handler![...].
//
// Rule (plan §15 + the Tauri architecture agent's risk callout): every path
// that touches the log directory goes through log::ritual_log_dir. No path
// literals live anywhere else in the Rust code.

pub mod log;
