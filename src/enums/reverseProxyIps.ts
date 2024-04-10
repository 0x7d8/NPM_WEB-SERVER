import { network } from "@rjweb/utils"

/**
 * HTTP Reverse Proxy IP Address Enum
 * @since 9.0.0
*/ export default Object.freeze({
	LOCAL: [
		new network.Subnet('10.0.0.0/8'),
		new network.Subnet('172.16.0.0/16'),
		new network.Subnet('192.168.0.0/16'),
		new network.IPAddress('127.0.0.1'),

		new network.Subnet('fd00::/8'),
		new network.Subnet('::ffff:0/112'),
		new network.IPAddress('::1'),
	],

	CLOUDFLARE: [
		new network.Subnet('173.245.48.0/20'),
		new network.Subnet('103.21.244.0/22'),
		new network.Subnet('103.22.200.0/22'),
		new network.Subnet('103.31.4.0/22'),
		new network.Subnet('141.101.64.0/18'),
		new network.Subnet('108.162.192.0/18'),
		new network.Subnet('190.93.240.0/20'),
		new network.Subnet('188.114.96.0/20'),
		new network.Subnet('197.234.240.0/22'),
		new network.Subnet('198.41.128.0/17'),
		new network.Subnet('162.158.0.0/15'),
		new network.Subnet('104.16.0.0/13'),
		new network.Subnet('104.24.0.0/14'),
		new network.Subnet('172.64.0.0/13'),
		new network.Subnet('131.0.72.0/22'),

		new network.Subnet('2400:cb00::/32'),
		new network.Subnet('2606:4700::/32'),
		new network.Subnet('2803:f800::/32'),
		new network.Subnet('2405:b500::/32'),
		new network.Subnet('2405:8100::/32'),
		new network.Subnet('2a06:98c0::/29'),
		new network.Subnet('2c0f:f248::/32'),
	],

	SPARKEDHOST: [
		new network.IPAddress('23.230.3.203'), // North America
		new network.IPAddress('128.140.127.215'), // Europe
	],
})