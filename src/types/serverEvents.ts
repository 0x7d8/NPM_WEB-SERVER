export type StartSuccess = {
	/** Whether the Action was a Success */ success: true
	/** The Port on which the Server launched on */ port: number
	/** A Message explaining what happened */ message: string
}

export type StartError = Error

export type StopSuccess = {
	/** Whether the Action was a Success */ success: true
	/** A Message explaining what happened */ message: string
}

export type StopError = Error