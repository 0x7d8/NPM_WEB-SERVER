import parseURL from "@/functions/parseURL"

type LocationValue = string | number

type LocationUnion = {
	__rjweb_type: 'union'
	values: string[]
}

type LocationParam = {
	__rjweb_type: 'param'
	name: string
}

type Location = LocationValue | LocationUnion | LocationParam

/**
 * Define a route location using template literals.
 * @since 9.5.6
*/ export default Object.assign(function location(locations: TemplateStringsArray, ...values: Location[]): string[] {
	const paths: string[][] = [[]]

	for (let i = 0; i < locations.length; i++) {
		for (let j = 0; j < paths.length; j++) {
			paths[j].push(locations[i])
		}

		if (values[i]) {
			const value = values[i]
			if (typeof value === 'object' && '__rjweb_type' in value) {
				switch (value.__rjweb_type) {
					case "union": {
						for (let j = 0; j < paths.length; j++) {
							paths[j].push(value.values[0])
						}

						if (value.values.length > 1) {
							const newPaths = []
							for (let j = 1; j < value.values.length; j++) {
								for (let k = 0; k < paths.length; k++) {
									newPaths.push([...paths[k].slice(0, -1), value.values[j]])
								}
							}

							paths.push(...newPaths)
						}

						break
					}

					case "param": {
						for (let j = 0; j < paths.length; j++) {
							paths[j].push(`{${value.name}}`)
						}

						break
					}
				}
			} else {
				for (let j = 0; j < paths.length; j++) {
					paths[j].push(String(value))
				}
			}
		}
	}

	return paths.map((path) => parseURL(path.join('/')).path)
}, {
	/**
	 * Define a Union of Locations in a Path
	 * @since 9.5.6
	*/ union: (...values: string[]): LocationUnion => ({
		__rjweb_type: 'union',
		values
	}),

	/**
	 * Define a Param in a Path
	 * @since 9.5.6
	*/ param: (name: string): LocationParam => ({
		__rjweb_type: 'param',
		name
	})
})