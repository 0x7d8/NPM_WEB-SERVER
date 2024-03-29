import { as, zValidate } from "rjutils-collection"
import { BaseParameterObject, HeaderObject, SchemaObject } from "../../types/openAPI3"
import { ExcludeFrom } from "../../types/internal"
import ParamsDefiner from "./paramsDefiner"

export default class DocumentationBuilder<Excluded extends (keyof DocumentationBuilder)[] = []> {
	protected data: {
		description: string
		deprecated: boolean
		headers: Record<string, HeaderObject>
		queries: Record<string, BaseParameterObject>
	} = {
		description: '',
		deprecated: false,
		headers: {},
		queries: {}
	}

	/**
	 * Add a Description to the Endpoint
	 * @since 8.5.0
	*/ @zValidate([ (z) => z.string() ])
	public description(description: string): ExcludeFrom<DocumentationBuilder<[...Excluded, 'description']>, [...Excluded, 'description']> {
		this.data.description = description

		return as<any>(this)
	}

	/**
	 * Mark the Endpoint as Deprecated
	 * @since 8.5.0
	*/ public deprecated(): ExcludeFrom<DocumentationBuilder<[...Excluded, 'deprecated']>, [...Excluded, 'deprecated']> {
		this.data.deprecated = true

		return as<any>(this)
	}

	/**
	 * Add Documentation for Headers
	 * @since 8.5.0
	*/ @zValidate([ (z) => z.function() ])
	public headers(callback: (builder: ParamsDefiner) => any): ExcludeFrom<DocumentationBuilder<[...Excluded, 'headers']>, [...Excluded, 'headers']> {
		const definer = new ParamsDefiner()
		callback(definer)

		Object.assign(this.data.headers, definer['data'])

		return as<any>(this)
	}

	/**
	 * Add Documentation for Queries
	 * @since 8.5.0
	*/ @zValidate([ (z) => z.function() ])
	public queries(callback: (builder: ParamsDefiner) => any): ExcludeFrom<DocumentationBuilder<[...Excluded, 'queries']>, [...Excluded, 'queries']> {
		const definer = new ParamsDefiner()
		callback(definer)

		Object.assign(this.data.queries, definer['data'])

		return as<any>(this)
	}
}