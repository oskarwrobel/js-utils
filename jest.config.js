module.exports = {
	preset: 'ts-jest',
	moduleFileExtensions: [
		'ts', 'js'
	],
	testEnvironment: 'node',
	transform: {
		'^.+\\.ts$': 'ts-jest'
	},
	testMatch: [
		'**/test/**/*.ts'
	]
};
