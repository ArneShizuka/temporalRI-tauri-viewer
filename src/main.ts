import { invoke } from "@tauri-apps/api/tauri"
import { open } from "@tauri-apps/api/dialog"

// import { Graph, AdjacencyList } from "./graph"

window.addEventListener("DOMContentLoaded", () => {
    // const adjList: AdjacencyList = {
    //     "1": {
    //         label: "a",
    //         edges: [
    //             {
    //                 target: "2",
    //                 timestamp: "3",
    //                 label: "b",
    //             },
    //         ],
    //     },
    //     "2": {
    //         label: "a",
    //         edges: [
    //             {
    //                 target: "6",
    //                 timestamp: "17",
    //                 label: "b",
    //             },
    //         ],
    //     },
    //     "3": {
    //         label: "a",
    //         edges: [
    //             {
    //                 target: "6",
    //                 timestamp: "14",
    //                 label: "b",
    //             },
    //         ],
    //     },
    //     "4": {
    //         label: "a",
    //         edges: [
    //             {
    //                 target: "7",
    //                 timestamp: "8",
    //                 label: "b",
    //             },
    //         ],
    //     },
    //     "5": {
    //         label: "a",
    //         edges: [
    //             {
    //                 target: "7",
    //                 timestamp: "2",
    //                 label: "b",
    //             },
    //         ],
    //     },
    //     "6": {
    //         label: "a",
    //         edges: [],
    //     },
    //     "7": {
    //         label: "a",
    //         edges: [
    //             {
    //                 target: "6",
    //                 timestamp: "13",
    //                 label: "b",
    //             },
    //         ],
    //     },
    // }

    // let graph = new Graph()
    // graph.buildGraph(adjList)

    const target = document.getElementById("target-btn") as HTMLButtonElement
    const query = document.getElementById("query-btn") as HTMLButtonElement
    const RiBtn = document.getElementById("RI-btn") as HTMLButtonElement
    let targetPath: string
    let queryPath: string

    target.addEventListener("click", async () => {
        const selected = await open({
            multiple: false,
            filters: [
                {
                    name: "Open Target File",
                    extensions: ["txt", "json"],
                },
            ],
        })

        targetPath = selected as string
        const targetLabel = document.getElementById(
            "target-label"
        ) as HTMLLabelElement
        targetLabel.textContent = `Target File: ${targetPath}`
    })

    query.addEventListener("click", async () => {
        const selected = await open({
            multiple: false,
            filters: [
                {
                    name: "Open Query File",
                    extensions: ["txt", "json"],
                },
            ],
        })

        queryPath = selected as string
        const queryLabel = document.getElementById(
            "query-label"
        ) as HTMLLabelElement
        queryLabel.textContent = `Query File: ${queryPath}`
    })

    RiBtn.addEventListener("click", () => {
        invoke<string>("launch_temporal_ri", {
            targetPath: targetPath,
            queryPath: queryPath,
        }).then((output) => {
            const nodeOccurrences: string[] = output
                .split("\t")[0]
                .split(",")
                .map((str) => {
                    return str.replace("(", "").replace(")", "")
                })
            const edgeOccurrences: string[] = output
                .split("\t")[1]
                .split("),(")
                .map((str) => {
                    return str.replace("(", "").replace(")", "")
                })

            const cy = document.getElementById("cy")
            if (cy !== null) {
                cy.textContent = "nodes: "
                for (let node of nodeOccurrences) {
                    cy.textContent += `${node} `
                }

                cy.textContent += "edges: "
                for (let edge of edgeOccurrences) {
                    cy.textContent += `${edge} `
                }
            }
        })
    })
})
