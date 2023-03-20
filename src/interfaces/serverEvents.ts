export interface StartSuccess {
	/** Whether the Action was a Success */ success: true
	/** The Port on which the Server launched on */ port: number
	/** A Message explaining what happened */ message: string
}

export interface StartError {
	/** Whether the Action was a Success */ success: false
	/** The Object containing the Servers Error */ error: Error
	/** A Message explaining what happened */ message: string
}

export interface StopSuccess {
	/** Whether the Action was a Success */ success: true
	/** A Message explaining what happened */ message: string
}

export interface StopError {
	/** Whether the Action was a Success */ success: false
	/** The Object containing the Servers Error */ error: Error
	/** A Message explaining what happened */ message: string
}