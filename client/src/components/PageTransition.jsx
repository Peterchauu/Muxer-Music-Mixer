import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionRef = useRef(null);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsTransitioning(true);
      
      // Wait for animation to complete before updating content
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, 800); // Match total animation duration

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <>
      {/* Sliding panels overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={`panel-${index}`}
              className="absolute top-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 slide-panel"
              style={{
                left: `${index * 20}%`,
                width: '20%',
                animationDelay: `${index * 0.08}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Page content */}
      <div ref={transitionRef}>
        {React.Children.map(children, (child) =>
          React.cloneElement(child, { key: displayLocation.pathname })
        )}
      </div>
    </>
  );
};

export default PageTransition;
