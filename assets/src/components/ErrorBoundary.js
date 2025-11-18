/**
 * Error Boundary Component
 *
 * Catches errors in React component tree and displays a fallback UI
 * instead of crashing the entire application.
 *
 * @package
 */

import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	spacing,
	colors,
	borderRadius,
	fontSize,
	fontWeight,
	noticeStyles,
} from '../utils/styles';
import { debugError } from '../utils/debug';

/**
 * Error Boundary component
 */
class ErrorBoundary extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError( error ) {
		// Update state so the next render will show the fallback UI
		return { hasError: true, error };
	}

	componentDidCatch( error, errorInfo ) {
		// Log error details for debugging
		debugError( 'Error caught by ErrorBoundary:', {
			error,
			errorInfo,
		} );

		this.setState( {
			error,
			errorInfo,
		} );

		// Optionally send to error reporting service
		if ( this.props.onError ) {
			this.props.onError( error, errorInfo );
		}
	}

	resetError = () => {
		this.setState( {
			hasError: false,
			error: null,
			errorInfo: null,
		} );

		if ( this.props.onReset ) {
			this.props.onReset();
		}
	};

	render() {
		if ( this.state.hasError ) {
			// Custom fallback UI if provided
			if ( this.props.fallback ) {
				return this.props.fallback( {
					error: this.state.error,
					errorInfo: this.state.errorInfo,
					resetError: this.resetError,
				} );
			}

			// Default fallback UI
			const containerStyle = {
				padding: spacing.lg,
			};

			const noticeStyle = {
				...noticeStyles.error,
				padding: spacing.md + ' ' + spacing.lg,
				margin: spacing.lg + ' 0',
			};

			const headingStyle = {
				margin: '0 0 ' + spacing.sm,
				fontSize: fontSize.xl,
				fontWeight: fontWeight.semibold,
				color: colors.text,
			};

			const paragraphStyle = {
				margin: '0 0 ' + spacing.sm,
				color: colors.text,
			};

			return (
				<div className="aether-error-boundary" style={ containerStyle }>
					<div
						className="aether-error-boundary__notice"
						style={ noticeStyle }
					>
						<h2
							className="aether-error-boundary__heading"
							style={ headingStyle }
						>
							{ __(
								'Something went wrong',
								'aether-site-exporter'
							) }
						</h2>
						<p
							className="aether-error-boundary__message"
							style={ paragraphStyle }
						>
							{ __(
								'An unexpected error occurred. Please try refreshing the page.',
								'aether'
							) }
						</p>
						{ this.state.error && (
							<details
								className="aether-error-boundary__details"
								style={ { marginTop: spacing.lg } }
							>
								<summary className="aether-error-boundary__summary">
									{ __(
										'Error details',
										'aether-site-exporter'
									) }
								</summary>
								<pre
									className="aether-error-boundary__error-text"
									style={ {
										marginTop: spacing.lg,
										padding: spacing.lg,
										background: colors.backgroundLighter,
										overflow: 'auto',
										fontSize: fontSize.sm,
									} }
								>
									{ this.state.error.toString() }
									{ this.state.errorInfo &&
										this.state.errorInfo.componentStack }
								</pre>
							</details>
						) }
						<button
							type="button"
							className="aether-error-boundary__retry-button"
							onClick={ this.resetError }
							style={ {
								marginTop: spacing.lg,
								padding: spacing.sm + ' ' + spacing.lg,
								background: colors.primary,
								color: colors.white,
								border: `1px solid ${ colors.primary }`,
								borderRadius: borderRadius.sm,
								cursor: 'pointer',
								fontSize: fontSize.sm,
								fontWeight: fontWeight.normal,
								lineHeight: 1.5,
							} }
						>
							{ __( 'Try again', 'aether-site-exporter' ) }
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
