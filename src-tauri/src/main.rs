// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Stdio};

#[tauri::command]
async fn launch_temporal_ri(
    handle: tauri::AppHandle,
    target_path: String,
    query_path: String,
) -> String {
    let temporal_ri_jar_path = handle
        .path_resolver()
        .resolve_resource("../java/TemporalRI.jar")
        .expect("failed to resolve TemporalRi.jar");

    let output = Command::new("java")
        .arg("-jar")
        .arg(&temporal_ri_jar_path)
        .arg("-t")
        .arg(target_path)
        .arg("-q")
        .arg(query_path)
        .arg("-o")
        .stdout(Stdio::piped())
        .output()
        .unwrap();

    return String::from_utf8(output.stdout).unwrap();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![launch_temporal_ri])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
