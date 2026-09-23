import type Route from "@/classes/Route"
import type { Method } from "@/types/global"

const noIndices: number[] = []

type SegmentNode = {
	literal: Map<string, SegmentNode> | null
	param: SegmentNode | null
	routes: number[]
}

type MethodGroup = {
	regexp: number[]
	tree: SegmentNode
}

export type RouteCandidates = {
	exact: number[]
	dynamic: number[]
	split: string[] | null
}

function createNode(): SegmentNode {
	return { literal: null, param: null, routes: [] }
}

function collect(node: SegmentNode, split: string[], depth: number, found: number[][]): void {
	if (depth === split.length) {
		if (node.routes.length) found.push(node.routes)
		return
	}

	const literal = node.literal?.get(split[depth])
	if (literal) collect(literal, split, depth + 1, found)
	if (node.param) collect(node.param, split, depth + 1, found)
}

/**
 * Lookup table over a routes array, rebuilt whenever routes get appended
 *
 * Static routes are looked up by their exact path, dynamic routes through a tree of their
 * literal segments (any segment containing a parameter is a wildcard), regexp routes are always candidates.
 * Candidates are returned in registration order so the first matching route still wins
 * @since 9.9.1
*/ export default class RouteIndex<Type extends 'http' | 'ws'> {
	private indexedLength = -1
	private exact = new Map<Method, Map<string, number[]>>()
	private dynamic = new Map<Method, MethodGroup>()

	constructor(private routes: Route<Type>[]) {}

	private rebuild(): void {
		this.exact.clear()
		this.dynamic.clear()

		for (let i = 0; i < this.routes.length; i++) {
			const route = this.routes[i], method = route['urlMethod'], urlData = route.urlData

			if (urlData.type === 'normal' && urlData.static) {
				let paths = this.exact.get(method)
				if (!paths) this.exact.set(method, paths = new Map())

				const indices = paths.get(urlData.value)
				if (indices) indices.push(i)
				else paths.set(urlData.value, [i])

				continue
			}

			let group = this.dynamic.get(method)
			if (!group) this.dynamic.set(method, group = { regexp: [], tree: createNode() })

			if (urlData.type === 'regexp') {
				group.regexp.push(i)
				continue
			}

			let node = group.tree
			for (let depth = 1; depth < urlData.segments.length; depth++) {
				const segment = urlData.segments[depth]

				if (segment.params.length) {
					if (!node.param) node.param = createNode()
					node = node.param
				} else {
					if (!node.literal) node.literal = new Map()

					let next = node.literal.get(segment.raw)
					if (!next) node.literal.set(segment.raw, next = createNode())
					node = next
				}
			}

			node.routes.push(i)
		}

		this.indexedLength = this.routes.length
	}

	/**
	 * Get the indices of static routes exactly matching the method and path, and of the dynamic routes that could match
	 * @since 9.9.1
	*/ public candidates(method: Method, path: string): RouteCandidates {
		if (this.indexedLength !== this.routes.length) this.rebuild()

		const exact = this.exact.get(method)?.get(path) ?? noIndices,
			group = this.dynamic.get(method)

		if (!group) return { exact, dynamic: noIndices, split: null }

		const split = path.split('/'), found: number[][] = []
		collect(group.tree, split, 1, found)
		if (group.regexp.length) found.push(group.regexp)

		if (found.length === 0) return { exact, dynamic: noIndices, split }
		if (found.length === 1) return { exact, dynamic: found[0], split }

		return { exact, dynamic: ([] as number[]).concat(...found).sort((a, b) => a - b), split }
	}
}
