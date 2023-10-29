import { invoke } from "@tauri-apps/api/tauri"

import { Graph, AdjacencyList } from "./graph"

window.addEventListener("DOMContentLoaded", () => {
    const adjList: AdjacencyList = {
        "1": {
            label: "a",
            edges: [
                {
                    target: "2",
                    timestamp: "3",
                    label: "b",
                },
            ],
        },
        "2": {
            label: "a",
            edges: [
                {
                    target: "6",
                    timestamp: "17",
                    label: "b",
                },
            ],
        },
        "3": {
            label: "a",
            edges: [
                {
                    target: "6",
                    timestamp: "14",
                    label: "b",
                },
            ],
        },
        "4": {
            label: "a",
            edges: [
                {
                    target: "7",
                    timestamp: "8",
                    label: "b",
                },
            ],
        },
        "5": {
            label: "a",
            edges: [
                {
                    target: "7",
                    timestamp: "2",
                    label: "b",
                },
            ],
        },
        "6": {
            label: "a",
            edges: [],
        },
        "7": {
            label: "a",
            edges: [
                {
                    target: "6",
                    timestamp: "13",
                    label: "b",
                },
            ],
        },
    }

    let graph = new Graph()
    graph.buildGraph(adjList)
})
