import { invoke } from "@tauri-apps/api/tauri"
import { open } from "@tauri-apps/api/dialog"
import { readTextFile } from "@tauri-apps/api/fs"

import { Graph, AdjacencyList } from "./graph"

window.addEventListener("DOMContentLoaded", () => {
    const target = document.getElementById("target-btn") as HTMLButtonElement
    const query = document.getElementById("query-btn") as HTMLButtonElement
    const RiBtn = document.getElementById("ri-btn") as HTMLButtonElement
    const loadGraph = document.getElementById("load-graph") as HTMLButtonElement

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

    loadGraph.addEventListener("click", () => {
        if (targetPath !== null) {
            readTextFile(targetPath).then((targetFile): void => {
                console.log(targetFile)
            })
        }
    })

    RiBtn.addEventListener("click", () => {
        invoke<string>("launch_temporal_ri", {
            targetPath: targetPath,
            queryPath: queryPath,
        }).then((output): void => {
            if (output === "No occurrences found") {
                console.log(output)
            } else {
                const outputArticle = document.getElementById("output")
                if (outputArticle !== null) {
                    outputArticle.innerHTML = ""
                }
                for (const [index, occ] of output.split("\n").entries()) {
                    const nodeOccurrences: string[] = occ
                        .split("\t")[0]
                        .split(",")
                        .map((str) => {
                            return str.replace("(", "").replace(")", "")
                        })
                    const edgeOccurrences: string[] = occ
                        .split("\t")[1]
                        .split("),(")
                        .map((str) => {
                            return str.replace("(", "").replace(")", "")
                        })

                    const card = document.createElement("details")
                    const summary = document.createElement("summary")
                    const nodes = document.createElement("ul")
                    const edges = document.createElement("ul")

                    summary.textContent = `# ${index + 1}`
                    nodes.textContent = "nodes"
                    edges.textContent = "edges"

                    card.appendChild(summary)
                    card.appendChild(nodes)
                    card.appendChild(edges)
                    outputArticle?.appendChild(card)

                    for (let node of nodeOccurrences) {
                        let liNode = document.createElement("li")
                        nodes.appendChild(liNode)
                        liNode.textContent = node
                    }

                    for (let edge of edgeOccurrences) {
                        let liEdge = document.createElement("li")
                        edges.appendChild(liEdge)
                        liEdge.textContent = edge
                    }
                }
            }
        })
    })
})
