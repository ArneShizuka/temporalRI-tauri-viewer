import { invoke } from "@tauri-apps/api/tauri"
import { open, save } from "@tauri-apps/api/dialog"
import { readTextFile } from "@tauri-apps/api/fs"

import { Graph, AdjacencyList } from "./graph"

declare global {
    interface Window {
        graph: Graph
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const target = document.getElementById("target-btn") as HTMLButtonElement
    const query = document.getElementById("query-btn") as HTMLButtonElement
    const RiBtn = document.getElementById("ri-btn") as HTMLButtonElement
    const loadGraphBtn = document.getElementById(
        "load-graph-btn"
    ) as HTMLButtonElement
    const saveOccBtn = document.getElementById(
        "save-occ-btn"
    ) as HTMLButtonElement

    let targetPath: string
    let queryPath: string
    let graph: Graph | null
    let occurrences: string[]

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
        targetLabel.textContent = `Target File: ${targetPath.replace(
            /^.*[\\/]/,
            ""
        )}`
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
        queryLabel.textContent = `Query File: ${queryPath.replace(
            /^.*[\\/]/,
            ""
        )}`
    })

    loadGraphBtn.addEventListener("click", () => {
        if (targetPath !== null) {
            readTextFile(targetPath).then((targetFile): void => {
                let lines: string[] = targetFile
                    .replaceAll("\r", "")
                    .split("\n")
                const numNodes: number = parseInt(lines.shift() as string)

                let adjList: AdjacencyList = {}

                if (lines[lines.length - 1] === "") lines.pop()

                for (let i = 0; i < numNodes; i++) {
                    adjList[lines[i].split("\t")[0]] = {
                        label: lines[i].split("\t")[1],
                        edges: [],
                    }
                }

                for (let i = numNodes; i < lines.length; i++) {
                    const source = lines[i].split("\t")[0]
                    const target = lines[i].split("\t")[1]
                    const timestamp = lines[i].split("\t")[2].split(":")[0]
                    const label = lines[i].split("\t")[2].split(":")[1]

                    adjList[source]["edges"].push({
                        label: label,
                        target: target,
                        timestamp: timestamp,
                    })
                }

                graph = new Graph()
                graph.buildGraph(adjList)
                window.graph = graph
            })
        }
    })

    RiBtn.addEventListener("click", () => {
        const outputArticle = document.getElementById("output") as HTMLElement
        outputArticle.ariaBusy = "true"
        invoke<string>("launch_temporal_ri", {
            targetPath: targetPath,
            queryPath: queryPath,
        }).then((output): void => {
            outputArticle.ariaBusy = ""
            if (output === "") {
                outputArticle.textContent = "No occurrences found"
            } else {
                outputArticle.innerHTML = ""
                occurrences = output.split("\n")
                for (let index = 0; index < occurrences.length; index++) {
                    let nodeOccurrences: string[] = occurrences[index]
                        .split("\t")[0]
                        .split(",")
                        .map((str) => {
                            return str
                                .replace("(", "")
                                .replace(")", "")
                                .split(":")[0]
                        })
                    let edgeOccurrences: {
                        source: string
                        dest: string
                        timestamp: string
                    }[] = occurrences[index]
                        .split("\t")[1]
                        .split("),(")
                        .map((str) => {
                            return str.replace("(", "").replace(")", "")
                        })
                        .map((str) => {
                            return {
                                source: str.split(",")[0],
                                dest: str.split(",")[1],
                                timestamp: str.split(",")[2].split(":")[0],
                            }
                        })

                    const card = document.createElement("details")
                    const summary = document.createElement("summary")
                    const grid = document.createElement("div")
                    const nodes = document.createElement("ul")
                    const edges = document.createElement("ul")
                    const showBtn = document.createElement("button")

                    summary.textContent = `# ${index + 1}`
                    nodes.textContent = "Nodes"
                    edges.textContent = "Edges"
                    showBtn.textContent = "Show in Graph"

                    grid.className = "grid"

                    card.appendChild(summary)
                    card.appendChild(grid)
                    grid.appendChild(nodes)
                    grid.appendChild(edges)
                    card.appendChild(showBtn)
                    outputArticle?.appendChild(card)

                    for (let i = 0; i < nodeOccurrences.length; i++) {
                        let liNode = document.createElement("li")
                        nodes.appendChild(liNode)
                        liNode.textContent = `id: ${nodeOccurrences[i]}`
                    }

                    for (let i = 0; i < edgeOccurrences.length; i++) {
                        let liEdge = document.createElement("li")
                        edges.appendChild(liEdge)
                        liEdge.innerHTML = `source: ${edgeOccurrences[i].source}<br>`
                        liEdge.innerHTML += `dest: ${edgeOccurrences[i].dest}<br>`
                        liEdge.innerHTML += `timestamp: ${edgeOccurrences[i].timestamp}`
                    }

                    showBtn.addEventListener("click", () => {
                        if (graph !== null) {
                            graph.removeOccurrences()
                            nodeOccurrences.forEach((node) => {
                                graph?.graph
                                    .$id(`${node}`)
                                    .addClass("occurrence")
                            })
                            edgeOccurrences.forEach((edge) => {
                                graph?.graph
                                    .$(
                                        `edge[source="${edge.source}"][target="${edge.dest}"][timestamp="${edge.timestamp}"]`
                                    )
                                    .addClass("occurrence")
                            })
                            graph.graph.fit(graph.graph.$(".occurrence"), 150)
                        }
                    })
                }
            }
        })
    })

    saveOccBtn.addEventListener("click", async () => {
        const selected = await save({
            filters: [
                {
                    name: "Occurrences File",
                    extensions: ["txt"],
                },
            ],
        })
    })
})
