import cytoscape from "cytoscape"

type Edge = {
    label: string
    target: string
    timestamp: string
}

type NodeData = {
    label: string
    edges: Edge[]
}

export type AdjacencyList = Record<string, NodeData>

export class Graph {
    graph: cytoscape.Core
    layoutOptions: cytoscape.LayoutOptions
    styleOptions: cytoscape.Stylesheet[]

    constructor() {
        this.graph = cytoscape({
            container: document.getElementById("cy"),
        })

        this.layoutOptions = {
            name: "cose",
            animate: true,
            padding: 50,
            fit: true,
            randomize: true,
            idealEdgeLength: (edge) => {
                return 32
            },
            componentSpacing: 100,
            nodeRepulsion: (node) => {
                return 2048
            },
        }

        this.styleOptions = [
            {
                selector: "node",
                style: {
                    label: "data(label)",
                },
            },
            {
                selector: "edge",
                style: {
                    label: "data(label)",
                    width: 3,
                    "line-color": "#ccc",
                    "target-arrow-color": "#ccc",
                    "target-arrow-shape": "triangle",
                    "curve-style": "bezier",
                },
            },
        ]

        this.graph.style(this.styleOptions)
    }

    addNodes(adjList: AdjacencyList): void {
        for (const nodeId in adjList) {
            this.graph.add({
                group: "nodes",
                data: {
                    id: nodeId,
                    label: adjList[nodeId]["label"],
                },
            })
        }
    }

    addEdges(adjList: AdjacencyList): void {
        let edgeNum: number = 0

        for (const startNode in adjList) {
            if (!("edges" in adjList[startNode])) continue
            for (const endNode of adjList[startNode]["edges"]) {
                this.graph.add({
                    group: "edges",
                    data: {
                        id: `e${edgeNum++}`,
                        label: endNode["label"],
                        source: startNode,
                        target: endNode["target"],
                        timestamp: endNode["timestamp"],
                    },
                })
            }
        }
    }

    buildGraph(adjList: AdjacencyList): void {
        this.addNodes(adjList)
        this.addEdges(adjList)

        this.graph.layout(this.layoutOptions).run()
        this.graph.elements().on("tap", (e) => {
            console.log(e.target.data())
        })
    }
}
