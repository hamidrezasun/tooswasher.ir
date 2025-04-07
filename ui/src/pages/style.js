import { css, keyframes } from '@emotion/react';
export const containerStyles = css`
  min-height: 100vh;
  background-color: #f3f4f6; /* Light background for visibility */
  padding-top: 130px; /* Explicitly set to 10rem in px */
  box-sizing: border-box; /* Ensure padding is included in height */
  @apply pt-40; /* Tailwind fallback */
`;