/**
 * Shared style utilities and constants
 *
 * Centralized styles for inline styling across components.
 *
 * @package
 */

export const colors = {
	primary: '#2271b1',
	primaryHover: '#135e96',
	primaryDark: '#0a4168',
	text: '#1d2327',
	textMuted: '#646970',
	textSecondary: '#50575e',
	white: '#fff',
	background: '#f6f7f7',
	backgroundLighter: '#f0f0f1',
	backgroundError: '#fcf0f1',
	borderLight: '#c3c4c7',
	borderLighter: '#e0e0e0',
	error: '#d63638',
	success: '#00a32a',
	warning: '#dba617',
	info: '#2271b1',
};

export const spacing = {
	xs: '0.25rem',
	sm: '0.5rem',
	md: '0.75rem',
	lg: '1.25rem',
	xl: '1.5rem',
	'2xl': '2rem',
};

export const borderRadius = {
	sm: '0.25rem',
	md: '0.5rem',
	lg: '0.75rem',
	full: '9999px',
};

export const fontSize = {
	xs: '0.75rem',
	sm: '0.875rem',
	base: '1rem',
	lg: '1.125rem',
	xl: '1.25rem',
	'2xl': '1.5rem',
};

export const fontWeight = {
	normal: 400,
	medium: 500,
	semibold: 600,
	bold: 700,
};

export const commonStyles = {
	section: {
		background: colors.white,
		border: `1px solid ${ colors.borderLight }`,
		boxShadow: '0 1px 1px rgba(0, 0, 0, 0.04)',
		marginBottom: spacing.lg,
		padding: 0,
	},
	sectionHeader: {
		borderBottom: `1px solid ${ colors.borderLight }`,
		paddingTop: spacing.lg,
		paddingBottom: spacing.lg,
		paddingLeft: spacing.lg,
		paddingRight: spacing.lg,
		background: colors.background,
	},
	card: {
		background: colors.white,
		border: `1px solid ${ colors.borderLight }`,
		borderRadius: borderRadius.sm,
		padding: spacing.lg,
	},
};

export const statusBadgeStyles = {
	base: {
		display: 'inline-block',
		paddingTop: '3px',
		paddingBottom: '3px',
		paddingLeft: spacing.sm,
		paddingRight: spacing.sm,
		borderRadius: borderRadius.sm,
		fontSize: fontSize.base,
		fontWeight: fontWeight.semibold,
		textTransform: 'uppercase',
		letterSpacing: '0.5px',
	},
	success: {
		background: '#d5f0dd',
		color: '#00833e',
	},
	error: {
		background: '#fcf0f1',
		color: '#c22c2e',
	},
	warning: {
		background: '#fcf0c7',
		color: '#826200',
	},
	info: {
		background: '#d7edff',
		color: '#135e96',
	},
};

export const noticeStyles = {
	base: {
		paddingTop: spacing.md,
		paddingBottom: spacing.md,
		paddingLeft: spacing.lg,
		paddingRight: spacing.lg,
		marginBottom: spacing.md,
		borderLeft: '4px solid',
		background: colors.white,
	},
	success: {
		borderLeftColor: colors.success,
		background: '#d5f0dd',
	},
	error: {
		borderLeftColor: colors.error,
		background: colors.backgroundError,
	},
	warning: {
		borderLeftColor: colors.warning,
		background: '#fcf0c7',
	},
	info: {
		borderLeftColor: colors.info,
		background: '#d7edff',
	},
};

/**
 * Create flexbox style object
 *
 * @param {string} direction Flex direction ('row' or 'column')
 * @param {string} gap       Gap spacing
 * @return {Object} Style object
 */
export const createFlexStyle = ( direction = 'row', gap = spacing.md ) => ( {
	display: 'flex',
	flexDirection: direction,
	gap,
} );

/**
 * Create grid style object
 *
 * @param {string} minColumnWidth Minimum column width
 * @param {string} gap            Gap spacing
 * @return {Object} Style object
 */
export const createGridStyle = (
	minColumnWidth = '16rem',
	gap = spacing.md
) => ( {
	display: 'grid',
	gridTemplateColumns: `repeat(auto-fit, minmax(${ minColumnWidth }, 1fr))`,
	gap,
} );

/**
 * Common utility styles
 */
export const utilityStyles = {
	noMargin: {
		margin: 0,
	},
	noMarginTop: {
		marginTop: 0,
	},
	noMarginBottom: {
		marginBottom: 0,
	},
};
