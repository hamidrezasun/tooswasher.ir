/** @jsxImportSource @emotion/react */
import { css, keyframes } from '@emotion/react';

export const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
`;

export const navbarStyles = css`
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;
  background: linear-gradient(to bottom, #ffffff, #f9fafb);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  direction: rtl;
  min-height: 132px; /* Updated to match current height */
`;

export const containerStyles = css`
  padding: 0.5rem 1rem;
  @media (max-width: 640px) {
    padding: 0.25rem 0.5rem;
  }
`;

export const topBarStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const logoStyles = css`
  color: #2563eb;
  font-weight: 700;
  font-size: 1.5rem;
  transition: color 0.3s ease;
  flex-shrink: 0;
  @media (max-width: 640px) {
    font-size: 1.25rem;
  }
`;

export const searchStyles = css`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  background-color: #ffffff;
  text-align: right;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-grow: 1;
  margin: 0 0.5rem;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }
  @media (max-width: 640px) {
    display: none;
  }
`;

export const authCartStyles = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  @media (max-width: 640px) {
    gap: 0.25rem;
  }
`;

export const buttonBase = css`
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  white-space: nowrap;
  min-width: 100px;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }
  @media (max-width: 640px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
    min-width: 80px;
  }
`;

export const loginButtonStyles = css`
  ${buttonBase};
  background: linear-gradient(135deg, #2563eb 0%, #60a5fa 100%);
  &:hover {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    animation: ${bounce} 0.5s ease infinite;
  }
`;

export const registerButtonStyles = css`
  ${buttonBase};
  background: linear-gradient(135deg, #16a34a 0%, #4ade80 100%);
  &:hover {
    background: linear-gradient(135deg, #14532d 0%, #22c55e 100%);
    animation: ${bounce} 0.5s ease infinite;
  }
`;

export const logoutButtonStyles = css`
  ${buttonBase};
  background: linear-gradient(135deg, #dc2626 0%, #f87171 100%);
  &:hover {
    background: linear-gradient(135deg, #b91c1c 0%, #ef4444 100%);
    animation: ${bounce} 0.5s ease infinite;
  }
`;

export const cartButtonStyles = css`
  ${buttonBase};
  background: #ffffff;
  color: #f97316;
  border: 2px solid #f97316;
  border-radius: 2rem;
  padding: 0.5rem 1.5rem;
  position: relative;
  font-weight: 700;
  &:hover {
    background: #f97316;
    color: white;
    border-color: #f97316;
    animation: ${bounce} 0.5s ease infinite;
  }
`;

export const categoryButtonStyles = css`
  ${buttonBase};
  background: linear-gradient(135deg, #2563eb 0%, #60a5fa 100%);
  &:hover {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    animation: ${bounce} 0.5s ease infinite;
  }
`;

export const searchButtonStyles = css`
  ${buttonBase};
  display: none;
  background: linear-gradient(135deg, #2563eb 0%, #60a5fa 100%);
  &:hover {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    animation: ${bounce} 0.5s ease infinite;
  }
  @media (max-width: 640px) {
    display: flex;
  }
`;

export const toggleButtonStyles = css`
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
  color: white;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  &:hover {
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }
  @media (max-width: 640px) {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }
`;

export const userInfoStyles = css`
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border-radius: 0.75rem;
  color: #374151;
  font-weight: 500;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  white-space: nowrap;
  @media (max-width: 640px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
  }
`;

export const menuStyles = css`
  margin-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-start;
  @media (max-width: 640px) {
    gap: 0.25rem;
  }
`;

export const menuItemStyles = css`
  color: #374151;
  padding: 0.5rem 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  &:hover {
    color: #2563eb;
    background: #f1f5f9;
    border-radius: 0.5rem;
  }
  @media (max-width: 640px) {
    padding: 0.3rem 0.6rem;
    font-size: 0.875rem;
  }
`;

export const sideNavbarStyles = css`
  position: fixed;
  top: 0;
  right: 0;
  width: 250px;
  height: 100%;
  background: #ffffff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  z-index: 60;
  transition: transform 0.3s ease;
  transform: translateX(100%);
  &.open {
    transform: translateX(0);
  }
`;

export const sideMenuItemStyles = css`
  display: block;
  padding: 0.5rem 1rem;
  color: #374151;
  font-weight: 500;
  transition: all 0.3s ease;
  &:hover {
    color: #2563eb;
    background: #f1f5f9;
    border-radius: 0.5rem;
  }
`;

export const popupStyles = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

export const popupContentStyles = css`
  background: white;
  padding: 1rem;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  direction: rtl;
`;