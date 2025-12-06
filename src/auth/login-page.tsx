import { css, Style } from "hono/css";
import type { FC } from "hono/jsx";

interface LoginPageProps {
	error?: string;
	redirectTo?: string;
}

// Global styles using Hono's CSS helper
const globalStyles = css`
  :-hono-global {
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html,
    body {
      height: 100%;
      width: 100%;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
        Ubuntu, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
`;

const containerStyles = css`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  width: 100%;
  max-width: 400px;
`;

const logoStyles = css`
  text-align: center;
  margin-bottom: 30px;

  h1 {
    color: #1a1a2e;
    font-size: 24px;
    font-weight: 600;
  }

  p {
    color: #666;
    font-size: 14px;
    margin-top: 5px;
  }
`;

const formGroupStyles = css`
  margin-bottom: 20px;
`;

const labelStyles = css`
  display: block;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const inputStyles = css`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e1e1;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const buttonStyles = css`
  width: 100%;
  padding: 14px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;

  &:hover {
    background: #4338ca;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const errorStyles = css`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fca5a5;
  border-left: 4px solid #dc2626;
  color: #991b1b;
  padding: 14px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  animation: slideIn 0.3s ease-out;

  &::before {
    content: "!";
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    background: #dc2626;
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 700;
  }
`;

const footerStyles = css`
  text-align: center;
  margin-top: 20px;
  color: #9ca3af;
  font-size: 12px;
`;

/**
 * Server-side rendered login page
 */
export const LoginPage: FC<LoginPageProps> = ({ error, redirectTo }) => {
	return (
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Login - Job Dashboard</title>
				<Style />
			</head>
			<body class={globalStyles}>
				<div class={containerStyles}>
					<div class={logoStyles}>
						<h1>Job Dashboard</h1>
						<p>Background Jobs Monitoring</p>
					</div>

					{error && (
						<div class={errorStyles}>
							<span>{error}</span>
						</div>
					)}

					<form method="post" action="/auth/login">
						{redirectTo && (
							<input type="hidden" name="redirectTo" value={redirectTo} />
						)}

						<div class={formGroupStyles}>
							<label class={labelStyles} for="username">
								Username
							</label>
							<input
								class={inputStyles}
								type="text"
								id="username"
								name="username"
								required
								autocomplete="username"
								placeholder="Enter your username"
							/>
						</div>

						<div class={formGroupStyles}>
							<label class={labelStyles} for="password">
								Password
							</label>
							<input
								class={inputStyles}
								type="password"
								id="password"
								name="password"
								required
								autocomplete="current-password"
								placeholder="Enter your password"
							/>
						</div>

						<button class={buttonStyles} type="submit">
							Sign In
						</button>
					</form>

					<div class={footerStyles}>Secure authentication required</div>
				</div>
			</body>
		</html>
	);
};
