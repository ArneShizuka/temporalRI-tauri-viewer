// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Stdio};

#[tauri::command]
async fn launch_temporal_ri(handle: tauri::AppHandle) -> String {
    let temporal_ri_jar_path = handle
        .path_resolver()
        .resolve_resource("../java/TemporalRI.jar")
        .expect("failed to resolve TemporalRi.jar");
    let target_path = handle
        .path_resolver()
        .resolve_resource("../java/target1.txt")
        .expect("failed to resolve target1.txt");
    let query_path = handle
        .path_resolver()
        .resolve_resource("../java/query1.txt")
        .expect("failed to resolve query1.txt");

    let output = Command::new("java")
        .arg("-jar")
        .arg(&temporal_ri_jar_path)
        .arg("-t")
        .arg(&target_path)
        .arg("-q")
        .arg(&query_path)
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
