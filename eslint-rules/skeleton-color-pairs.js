/**
 * ESLint rule to check Skeleton UI color pairs sum to 1000
 *
 * Example valid: bg-surface-50-950, text-primary-200-800
 * Example invalid: bg-surface-50-900, text-primary-300-600
 */
export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'enforce Skeleton UI color pairs sum to 1000',
			category: 'Stylistic Issues',
			recommended: true
		},
		fixable: 'code',
		schema: [],
		messages: {
			invalidColorPair:
				'Skeleton UI color pair {{colorPair}} should sum to 1000, got {{sum}}. Use {{suggestion}} instead.'
		}
	},

	create(context) {
		// Regex to match Skeleton UI color patterns: color-number-number
		const colorPairPattern =
			/(bg|text|border|ring|outline|fill|stroke|accent|caret|placeholder|selection|divide|space)-(\w+)-(\d+)-(\d+)/g;

		function checkColorPairs(node, value) {
			const matches = [...value.matchAll(colorPairPattern)];

			matches.forEach((match) => {
				const [fullMatch, property, color, lightShade, darkShade] = match;
				const light = parseInt(lightShade, 10);
				const dark = parseInt(darkShade, 10);
				const sum = light + dark;

				if (sum !== 1000) {
					// Calculate correct dark shade
					const correctDark = 1000 - light;
					const suggestion = `${property}-${color}-${light}-${correctDark}`;

					context.report({
						node,
						messageId: 'invalidColorPair',
						data: {
							colorPair: fullMatch,
							sum: sum.toString(),
							suggestion
						},
						fix(fixer) {
							const newValue = value.replace(fullMatch, suggestion);
							return fixer.replaceText(node, `"${newValue}"`);
						}
					});
				}
			});
		}

		return {
			// Check class attributes in JSX/HTML
			JSXAttribute(node) {
				if (node.name && node.name.name === 'class' && node.value) {
					if (node.value.type === 'Literal' && typeof node.value.value === 'string') {
						checkColorPairs(node.value, node.value.value);
					}
					if (
						node.value.type === 'JSXExpressionContainer' &&
						node.value.expression.type === 'Literal' &&
						typeof node.value.expression.value === 'string'
					) {
						checkColorPairs(node.value.expression, node.value.expression.value);
					}
				}
			},

			// Check template literals and string literals
			Literal(node) {
				if (typeof node.value === 'string' && colorPairPattern.test(node.value)) {
					checkColorPairs(node, node.value);
				}
			},

			// Check template literals
			TemplateLiteral(node) {
				node.quasis.forEach((quasi) => {
					if (colorPairPattern.test(quasi.value.raw)) {
						checkColorPairs(quasi, quasi.value.raw);
					}
				});
			}
		};
	}
};
