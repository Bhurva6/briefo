"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CampaignInput } from '../types';

interface AppState {
  campaignInput: CampaignInput;
  currentStep: number;
}

type AppAction =
  | { type: 'UPDATE_CAMPAIGN_INPUT'; payload: Partial<CampaignInput> }
  | { type: 'SET_CURRENT_STEP'; payload: number };

const initialState: AppState = {
  campaignInput: {},
  currentStep: 1,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'UPDATE_CAMPAIGN_INPUT':
      return {
        ...state,
        campaignInput: { ...state.campaignInput, ...action.payload },
      };
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
