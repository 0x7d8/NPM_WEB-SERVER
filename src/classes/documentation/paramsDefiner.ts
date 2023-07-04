import { as, zValidate } from "rjutils-collection"
import { BaseParameterObject, SchemaObject } from "../../types/openAPI3"
import { ExcludeFrom } from "../../types/internal"

class ParamDefiner<Excluded extends (keyof ParamDefiner)[] = []> {
	protected data: BaseParameterObject = {}

	/**
	 * Describe your Key in Detail
	 * @since 8.5.0
	*/ @zValidate([ (z) => z.string() ])
	public description(description: string): ExcludeFrom<ParamDefiner<[...Excluded, 'description']>, [...Excluded, 'description']> {
		this.data.description = description

		return as<any>(this)
	}

	/**
	 * Mark the Key as required
	 * @since 8.5.0
	*/ public required(): ExcludeFrom<ParamDefiner<[...Excluded, 'required']>, [...Excluded, 'required']> {
		this.data.required = true

		return as<any>(this)
	}

	/**
	 * Mark the Key as deprecated
	 * @since 8.5.0
	*/ public deprecated(): ExcludeFrom<ParamDefiner<[...Excluded, 'deprecated']>, [...Excluded, 'deprecated']> {
		this.data.deprecated = true

    return as<any>(this)
	}

	/**
	 * Set a Schema for the Key
	 * @since 8.5.0
	*/ @zValidate([ (z) => z.instanceof(Object) ])
	public schema(schema: SchemaObject): ExcludeFrom<ParamDefiner<[...Excluded, 'schema']>, [...Excluded, 'schema']> {
		this.data.schema = schema

    return as<any>(this)
	}
}

export default class ParamsDefiner {
	protected data: Record<string, BaseParameterObject> = {}

	/**
	 * Document a Key
	 * @example
	 * ```
	 * server.path('/', (path) => path
	 *   .http('GET', '/wait', (http) => http
	 *     .document((docs) => docs
	 *       .queries((queries) => queries
	 *         .add('duration', (key) => key
	 *           .description('The Duration in Seconds for waiting')
	 *           .required()
	 *         )
	 *       )
	 *     )
	 *     .onRequest(async(ctr) => {
	 *       if (!ctr.queries.has('duration'))) return ctr.status((s) => s.BAD_REQUEST).print('Missing the Duration query...')
	 * 
	 *       await new Promise((r) => setTimeout(r, Number(ctr.queries.get('duration')) * 1000))
	 *       return ctr.print(`waited ${ctr.queries.get('duration')} seconds`)
	 *     })
	 *   )
	 * )
	 * ```
	 * @since 8.5.0
	*/ @zValidate([ (z) => z.string(), (z) => z.function().returns(z.instanceof(ParamDefiner)) ])
	public add(key: string, callback: (definer: ParamDefiner) => ParamDefiner): this {
		this.data[key] = callback(new ParamDefiner())['data']

		return this
	}
}