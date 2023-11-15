// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use dunce::canonicalize;
use std::{
    os::windows::process::CommandExt,
    process::{Command, Stdio},
};

#[tauri::command]
async fn launch_temporal_ri(
    handle: tauri::AppHandle,
    target_path: String,
    query_path: String,
) -> String {
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let temporal_ri_jar_path = handle
        .path_resolver()
        .resolve_resource("../java/TemporalRI.jar")
        .expect("failed to resolve TemporalRi.jar");

    let output = Command::new("java")
        .arg("-jar")
        .arg(canonicalize(temporal_ri_jar_path).unwrap())
        .arg("-t")
        .arg(target_path)
        .arg("-q")
        .arg(query_path)
        .arg("-o")
        .creation_flags(CREATE_NO_WINDOW)
        .stdout(Stdio::piped())
        .output()
        .unwrap();

    let stdout = String::from_utf8(output.stdout).unwrap();

    return process_output(&stdout)
        .unwrap_or("No occurrences found")
        .to_string();
}

fn process_output(output: &str) -> Option<&str> {
    if let Some(found_index) = output.find("Edges") {
        if let Some(occurrences_start) = output[found_index..].find("\n") {
            let start = found_index + occurrences_start;
            if let Some(occurrences_end) = output[start..].find("Done!") {
                let end = start + occurrences_end;

                return Some(&output[start..end].trim());
            }
        }
    }
    return None;
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![launch_temporal_ri])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
