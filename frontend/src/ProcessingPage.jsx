import React, { useState, useEffect } from 'react';

const ProcessingPage = ({ onSkip, onAutoFinish }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);

  // Simulate progress animation
  useEffect(() => {
    const tick = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(tick);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (progress === 100 && onAutoFinish) {
      onAutoFinish();
    }
  }, [progress, onAutoFinish]);

  
  useEffect(() => {
    if (progress >= 25 && progress < 50) setCurrentStep(2);
    else if (progress >= 50 && progress < 75) setCurrentStep(3);
    else if (progress >= 75) setCurrentStep(4);
  }, [progress]);

  const steps = [
    { id: 1, name: 'Image preprocessing' },
    { id: 2, name: 'Text recognition' },
    { id: 3, name: 'Error correction' },
    { id: 4, name: 'Generating results' },
  ];

  const getStatus = (stepId) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.processingCard}>
          <div style={styles.spinnerContainer}>
            <div style={styles.spinner}></div>
          </div>

          <h2 style={styles.title}>Processing Your Notes</h2>
          <p style={styles.subtitle}>This may take a few seconds...</p>

          <div style={styles.stepsContainer}>
            {steps.map(step => {
              const status = getStatus(step.id);

              return (
                <div
                  key={step.id}
                  style={{
                    ...styles.step,
                    ...(status === 'completed' ? styles.stepCompleted : {}),
                    ...(status === 'active' ? styles.stepActive : {}),
                    ...(status === 'pending' ? styles.stepPending : {}),
                  }}
                >
                  <div style={styles.stepIcon}>
                    {status === 'completed' && (
                      <svg style={styles.iconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}

                    {status === 'active' && (
                      <div style={styles.activeSpinner}></div>
                    )}

                    {status === 'pending' && (
                      <div style={styles.pendingCircle}></div>
                    )}
                  </div>

                  <div style={styles.stepContent}>
                    <p style={styles.stepName}>{step.name}</p>
                    <p style={styles.stepMessage}>
                      {status === 'completed'
                        ? 'Completed'
                        : status === 'active'
                          ? `In progress... ${progress}%`
                          : 'Pending'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          
        </div>
      </div>

      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};


const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
    padding: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: { maxWidth: '600px', width: '100%' },
  processingCard: {
    backgroundColor: 'white',
    borderRadius: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    padding: '3rem',
    textAlign: 'center',
  },
  spinnerContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem',
  },
  spinner: {
    width: '80px',
    height: '80px',
    border: '4px solid #E0E7FF',
    borderTop: '4px solid #4F46E5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '0.75rem',
  },
  subtitle: { color: '#6B7280', marginBottom: '2.5rem' },
  stepsContainer: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  step: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '0.75rem',
  },
  stepCompleted: { backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' },
  stepActive: { backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' },
  stepPending: { backgroundColor: '#F9FAFB', border: '1px solid transparent' },
  stepIcon: { width: '24px' },
  iconSvg: { width: '24px', height: '24px', color: '#22C55E' },
  activeSpinner: {
    width: '20px',
    height: '20px',
    border: '3px solid #BFDBFE',
    borderTop: '3px solid #4F46E5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  pendingCircle: {
    width: '20px',
    height: '20px',
    border: '3px solid #D1D5DB',
    borderRadius: '50%',
  },
  stepContent: { flex: 1 },
  stepName: { fontWeight: '500' },
  stepMessage: { fontSize: '0.875rem', color: '#6B7280' },
  skipButton: {
    marginTop: '2rem',
    color: '#4F46E5',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
};

export default ProcessingPage;
