import { useCallback, useEffect, useState } from 'react';

import {
  FEEDBACK_CHANGE_EVENT,
  readFinanceFeedbackPreference,
  triggerFinanceFeedback,
  writeFinanceFeedbackPreference,
} from '../lib/financeFeedback.js';

export function useFinanceFeedback() {
  const [enabled, setEnabled] = useState(() => readFinanceFeedbackPreference());

  useEffect(() => {
    const handlePreferenceEvent = (event) => {
      const nextValue = event?.detail?.enabled;
      if (typeof nextValue === 'boolean') {
        setEnabled(nextValue);
      } else {
        setEnabled(readFinanceFeedbackPreference());
      }
    };

    window.addEventListener(FEEDBACK_CHANGE_EVENT, handlePreferenceEvent);
    return () => window.removeEventListener(FEEDBACK_CHANGE_EVENT, handlePreferenceEvent);
  }, []);

  const setPreference = useCallback((value) => {
    const normalized = Boolean(value);
    setEnabled(normalized);
    writeFinanceFeedbackPreference(normalized);
  }, []);

  const toggle = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    writeFinanceFeedbackPreference(next);
    return next;
  }, [enabled]);

  const feedback = useCallback(
    (kind) => {
      if (!enabled) {
        return;
      }
      triggerFinanceFeedback(kind);
    },
    [enabled]
  );

  return {
    enabled,
    setPreference,
    toggle,
    feedback,
  };
}

