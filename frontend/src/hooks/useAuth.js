import { useState, useEffect, useCallback } from 'react';
import { getSessionToken, clearSessionToken, dashboardAPI } from '../services/api';

/**
 * useAuth hook
 * - isLoading: boolean while validating session / fetching minimal dashboard
 * - isAuthenticated: true if session token exists and validated
 * - hasInvestorAccount: true if dashboard indicates an investor account
 * - refresh: triggers re-check
 */
export default function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasInvestorAccount, setHasInvestorAccount] = useState(false);

  const evaluateSession = useCallback(async (forceFresh = false) => {
    setIsLoading(true);
    try {
      const token = getSessionToken();
      if (!token) {
        setIsAuthenticated(false);
        setHasInvestorAccount(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Fetch dashboard data. If forceFresh is true, bypass cache.
      const data = await dashboardAPI.getDashboardData(!forceFresh);

      // Prefer explicit flag from backend when present
      if (data && typeof data.has_investor_account !== 'undefined') {
        setHasInvestorAccount(!!data.has_investor_account);
      } else if (data && data.investment) {
        // fallback: check common fields
        const inv = data.investment;
        // treat presence of total_balance or investments array with length as indicator
        if (typeof inv.total_balance !== 'undefined') {
          setHasInvestorAccount(true);
        } else if (Array.isArray(data.investments) && data.investments.length > 0) {
          setHasInvestorAccount(true);
        } else {
          setHasInvestorAccount(false);
        }
      } else {
        setHasInvestorAccount(false);
      }
    } catch (err) {
      // Cleartoken on 401/Unauthorized
      const msg = (err && err.message) ? err.message : '';
      if (msg.includes('401') || /unauthor/i.test(msg)) {
        try { clearSessionToken(); } catch (e) {}
        setIsAuthenticated(false);
        setHasInvestorAccount(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Evaluate on mount (allow cached quick return but also trigger refresh later if cached)
    evaluateSession(false);

    // Listen for dashboard refreshes and re-evaluate (this will pick up new cache)
    const handler = () => {
      evaluateSession(true);
    };

    window.addEventListener('dashboard:refreshed', handler);
    return () => window.removeEventListener('dashboard:refreshed', handler);
  }, [evaluateSession]);

  return {
    isLoading,
    isAuthenticated,
    hasInvestorAccount,
    refresh: () => evaluateSession(true)
  };
}
