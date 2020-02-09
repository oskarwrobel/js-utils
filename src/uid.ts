/**
 * Returns a unique id. This id consist of an 'e' character and a randomly generated string of 32 aphanumeric characters.
 * Each character in uid string represents a hexadecimal digit (base 16).
 */
export default function uid(): string {
	let uuid = 'e'; // Make sure that id does not start with number.

	for ( let i = 0; i < 8; i++ ) {
		uuid += Math.floor( ( 1 + Math.random() ) * 0x10000 ).toString( 16 ).substring( 1 );
	}

	return uuid;
}
