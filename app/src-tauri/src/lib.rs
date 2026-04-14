// morning-ritual Tauri backend entry point. The shell is deliberately small —
// see plan-morning-ritual.md §3 and §10. Rust owns the filesystem and the
// log directory; the frontend owns every pixel and all of the UX state.
//
// The full command surface lives in commands::log. Adding a new command
// here means: write it in commands/, add it to the invoke_handler list,
// and hand-write its TypeScript wrapper in src/lib/log.ts. (We're not
// using tauri-specta in Phase C — hand-written bindings are simpler and
// one fewer thing to get wrong on the first build. The type-safe bindings
// layer can earn itself later if the command surface grows.)

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::log::read_day,
            commands::log::append_section,
            commands::log::grep_logs,
            commands::log::save_day,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
