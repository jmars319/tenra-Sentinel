#[tauri::command]
fn health_ping() -> &'static str {
    "sentinel-desktop-ok"
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![health_ping])
        .run(tauri::generate_context!())
        .expect("error while running Sentinel desktop");
}
