import React from "react"
import ReactDOM from "react-dom/client"
import { ChakraProvider, extendTheme } from "@chakra-ui/react"

import Index from "@/index"

const theme = extendTheme({
  config: {
    cssVarPrefix: 'ck',
    initialColorMode: 'dark'
  }
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<ChakraProvider theme={theme}>
			<Index />
		</ChakraProvider>
	</React.StrictMode>
)