import { Line } from "react-chartjs-2"
import { Chart, ChartDataset, registerables } from "chart.js"
import { Button, IconButton, Checkbox, Heading, Image, Input, Spinner, useToast } from "@chakra-ui/react"
import useWebSocket, { ReadyState } from "react-use-websocket"
import { useCookies } from "react-cookie"
import { useState } from "react"
import { DashboardStats } from "@def"
import b from "bytes"

Chart.register(...registerables)

import { TbAlertTriangle, TbBrandGithub, TbSocial } from "react-icons/tb"

const hashCode = (value: string) => {
	return value.split('').reduce((a, b) => {
		a = ((a << 5) - a) + b.charCodeAt(0)
		return a & a
	}, 0).toString(16).replace('-', 'M')
}

import "@/css/tailwind.css"

const StatNumBox = ({ title, stat }: { title: string; stat: string | number }) => (
	<div className={'relative mb-3 text-center items-center w-full h-auto flex flex-col justify-center px-2 py-1 bg-gray-800 bg-opacity-70 rounded-lg'}>
		<p className={'font-semibold text-[#5E5E60]'}>{title}</p>
		<p className={'text-[#5E5E60] opacity-70'}>{stat}</p>
	</div>
)

const StatBox = ({ title, stat, lineMode, dataSets, labels, format }: { lineMode: boolean; format?: (value: number) => string | number; labels: (number | string)[]; dataSets: ChartDataset<'line'>[]; title: string; stat: string | number }) => (
	<div className={'flex flex-col w-96 h-64 text-center mx-2 my-4'}>
		<StatNumBox title={title} stat={stat} />
		<div className={'relative text-center items-center w-full h-full flex flex-col px-2 py-1 bg-gray-800 bg-opacity-70 rounded-lg'}>
			{lineMode && <Line
				height={'100%'}
				data={{
					labels,
					datasets: dataSets.map((d) => {
						d.tension = 0.4
						d.fill = true

						return d
					})
				}}

				options={{
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							display: false
						}, filler: {
							propagate: false,
						}, tooltip: {
							enabled: false
						}
					}, interaction: {
						intersect: false,
					}, scales: {
						y: {
							min: 0,
							ticks: {
								callback: format as never
							}, suggestedMax: 10
						}
					}
				}}
			/>}
		</div>
	</div>
)

export default function Index() {
	const [ cpuStats, setCpuStats ] = useState<{ time: string, amount: number }[]>([])
	const [ ramStats, setRamStats ] = useState<{ time: string, amount: number }[]>([])
	const [ attempts, setAttempts ] = useState(0)
	const [ savePassword, setSavePassword ] = useState(false)
	const [ passwordInput, setPasswordInput ] = useState('')
	const [ password, setPassword ] = useState('')

	const [ cookies, setCookie, deleteCookie ] = useCookies<'rjweb_password', Record<'rjweb_password', string>>()
	const toast = useToast({
		duration: 3000,
		position: 'top-right',
		isClosable: true,
		variant: 'subtle'
	})

	const websocket = useWebSocket<DashboardStats>(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/rjweb-dashboard/ws`, {
		retryOnError: false,
		shouldReconnect: () => false,
		onClose() {
			if (cookies.rjweb_password && attempts > 0) deleteCookie('rjweb_password', {
				sameSite: 'none',
				secure: true
			})

			if (password) {
				setAttempts((a) => a + 1)
				toast({
					title: 'Authentication',
					colorScheme: 'yellow',
					icon: <TbAlertTriangle size={48} />,
					description: 'The Password is invalid.'
				})
			}
		}, onMessage(event) {
			if (savePassword && !cookies.rjweb_password) setCookie('rjweb_password', hashCode(password), {
				maxAge: 2629800,
				sameSite: 'none',
				secure: true
			})

			const stats: DashboardStats = JSON.parse(event.data)
			setCpuStats((cpu) => [ ...cpu.slice(-9), { time: stats.cpu.time, amount: Number(stats.cpu.usage) } ])
			setRamStats((ram) => [ ...ram.slice(-9), { time: stats.memory.time, amount: Number(stats.memory.usage) } ])
		}, queryParams: {
			password: cookies.rjweb_password ?? hashCode(password)
		}
	})

	return (
		<div className={'flex flex-col flex-wrap top-0 left-0 w-[100vw] h-[100vh] items-center'}>
			{websocket.readyState === ReadyState.CONNECTING || (websocket.readyState === ReadyState.OPEN && !websocket.lastJsonMessage) && (
				<>
					<div className={'absolute z-40 bg-gray-900 opacity-50 top-0 left-0 w-[100vw] h-[100vh]'} />
					<Spinner size={'xl'} className={'absolute z-50 top-[50vh] left-[50vw]'} />
				</>
			)}

			{websocket.readyState === ReadyState.OPEN && websocket.lastJsonMessage ? (
				<>
					<nav className={'flex flex-row p-2 items-center justify-between absolute w-[100vw] top-0 left-0 h-16 bg-gray-900 bg-opacity-30 backdrop-filter backdrop-blur-lg'}>
						<div className={'flex flex-row justify-start w-auto h-full'}>
							<Image className={'px-2 hover:opacity-50 hover:cursor-pointer'} src={'https://img.rjansen.de/rjweb/icon.svg'} onClick={() => {
								setPassword('')
								deleteCookie('rjweb_password', {
									sameSite: 'none',
									secure: true
								})
							}} />
							<Heading className={'whitespace-nowrap'}>rjweb-server</Heading>
						</div>
						<div className={'justify-end'}>
							<IconButton onClick={() => window.open('https://github.com/rotvproHD/NPM_WEB-SERVER')} aria-label={'Github'} icon={<TbBrandGithub size={24} />} />
						</div>
					</nav>

					<div className={'flex flex-col'}>
						<div className={'w-full flex flex-wrap justify-center mt-20'}>
							<div className={'w-96 mx-2 my-4'}>
								<StatNumBox
									title={'Registered Routes'}
									stat={websocket.lastJsonMessage.routes.user + websocket.lastJsonMessage.routes.automatic}
								/>
							</div>

							<div className={'w-96 mx-2 my-4'}>
								<StatNumBox
									title={'Static Files'}
									stat={websocket.lastJsonMessage.staticFiles}
								/>
							</div>

							<div className={'w-96 mx-2 my-4'}>
								<StatNumBox
									title={'Middlewares'}
									stat={websocket.lastJsonMessage.middlewares}
								/>
							</div>

							<div className={'w-96 mx-2 my-4'}>
								<StatNumBox
									title={'Internal Logs (Debug, Error, Warning)'}
									stat={websocket.lastJsonMessage.internalLogs}
								/>
							</div>

							<div className={'w-96 mx-2 my-4'}>
								<StatNumBox
									title={'Cached Objects'}
									stat={websocket.lastJsonMessage.cached}
								/>
							</div>
						</div>
						<div className={'w-full flex flex-wrap justify-center'}>
							<StatBox
								title={'CPU Usage'}
								stat={`${websocket.lastJsonMessage.cpu.usage}%`}
								lineMode={true}
								format={(v) => v + '%'}
								labels={cpuStats.map((s) => s.time)}
								dataSets={[
									{
										label: 'Stat',
										data: cpuStats.map((s) => s.amount)
									}
								]}
							/>

							<StatBox
								title={'RAM Usage'}
								stat={`${b(websocket.lastJsonMessage.memory.usage)}`}
								lineMode={true}
								format={b}
								labels={ramStats.map((s) => s.time)}
								dataSets={[
									{
										label: 'Stat',
										data: ramStats.map((s) => s.amount)
									}
								]}
							/>
						</div>
						<div className={'w-full flex flex-wrap justify-center'}>
							<StatBox
								title={'HTTP Requests'}
								stat={`${websocket.lastJsonMessage.requests.total} (${websocket.lastJsonMessage.requests.perSecond}/s)`}
								lineMode={true}
								labels={websocket.lastJsonMessage.requests.hours.map((h) => h.hour + ':00')}
								dataSets={[
									{
										label: 'Incoming',
										data: websocket.lastJsonMessage.requests.hours.map((h) => h.amount)
									}
								]}
							/>

							<StatBox
								title={'Websockets Opened'}
								stat={`${websocket.lastJsonMessage.webSockets.opened.total} (${websocket.lastJsonMessage.webSockets.opened.perSecond}/s)`}
								lineMode={true}
								labels={websocket.lastJsonMessage.webSockets.opened.hours.map((h) => h.hour + ':00')}
								dataSets={[
									{
										label: 'Stat',
										data: websocket.lastJsonMessage.webSockets.opened.hours.map((h) => h.amount)
									}
								]}
							/>

							<StatBox
								title={'Websocket Messages'}
								stat={`${websocket.lastJsonMessage.webSockets.messages.incoming.total} (${websocket.lastJsonMessage.webSockets.messages.incoming.perSecond}/s) | ${websocket.lastJsonMessage.webSockets.messages.outgoing.total} (${websocket.lastJsonMessage.webSockets.messages.outgoing.perSecond}/s)`}
								lineMode={true}
								labels={websocket.lastJsonMessage.webSockets.messages.outgoing.hours.map((h) => h.hour + ':00')}
								dataSets={[
									{
										label: 'Incoming',
										data: websocket.lastJsonMessage.webSockets.messages.incoming.hours.map((h) => h.amount)
									},
									{
										label: 'Outgoing',
										data: websocket.lastJsonMessage.webSockets.messages.outgoing.hours.map((h) => h.amount)
									}
								]}
							/>

							<StatBox
								title={'Network Traffic'}
								stat={`${b(websocket.lastJsonMessage.data.incoming.total)} (${b(websocket.lastJsonMessage.data.incoming.perSecond)}/s) | ${b(websocket.lastJsonMessage.data.outgoing.total)} (${b(websocket.lastJsonMessage.data.outgoing.perSecond)}/s)`}
								lineMode={true}
								format={b}
								labels={websocket.lastJsonMessage.data.outgoing.hours.map((h) => h.hour + ':00')}
								dataSets={[
									{
										label: 'Incoming',
										data: websocket.lastJsonMessage.data.incoming.hours.map((h) => h.amount)
									},
									{
										label: 'Outgoing',
										data: websocket.lastJsonMessage.data.outgoing.hours.map((h) => h.amount)
									}
								]}
							/>
						</div>
					</div>
				</>
			) : (
				<div className={'flex flex-col items-center'}>
					<Image src={'https://img.rjansen.de/rjweb/icon.svg'} className={'max-w-md'} width={'calc(100vw - 1rem)'} />
					<Heading className={'mb-8'} color={'whiteAlpha.500'}>1.1.1</Heading>
					<form className={'flex flex-col p-4 bg-gray-900 opacity-70 rounded-lg'} onSubmit={(e) => e.preventDefault()}>
						<div className={'flex justify-between'}>
							<Input variant={'filled'} placeholder={'Password'} onChange={(c) => setPasswordInput(c.target.value)} width={'50%'} />
							<Button type={'submit'} leftIcon={<TbSocial size={24} />} className={'justify-end'} onClick={() => {
								setPassword(passwordInput)
							}} isDisabled={password === passwordInput}>
								Connect
							</Button>
						</div>
						<div className={'mt-4 flex flex-row'}>
							<Checkbox size={'md'} onChange={() => setSavePassword((s) => !s)}>
								Save Hashed Password
							</Checkbox>
						</div>
					</form>
				</div>
			)}
		</div>
	)
}