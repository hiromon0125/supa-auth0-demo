/**
 * This is a simple Node.js script that takes a JWT as a command-line argument, decodes it using the `jwt-decode` library, and prints the decoded payload and header to the console.
 * Usage:
 *  node index.js <your-jwt-here>
 * or
 *  pnpm run decode <your-jwt-here>
 *
 */
import { jwtDecode } from 'jwt-decode';

const token = process.argv.slice(2)[0];
if (!token) {
	console.error('Please provide a JWT as a command-line argument');
	process.exit(1);
}
console.log('Token:', token);

const decoded = jwtDecode(token);

console.log(decoded);

// decode header by passing in options (useful for when you need `kid` to verify a JWT):
const decodedHeader = jwtDecode(token, { header: true });
console.log(decodedHeader);
