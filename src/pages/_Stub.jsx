import React from 'react'
const Stub = ({ title }) => (
  <div className="flex items-center justify-center h-full min-h-[40vh]">
    <div className="text-center">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <span className="font-mono text-primary font-bold text-sm">◎</span>
      </div>
      <h2 className="font-display font-semibold text-ink text-lg">{title}</h2>
      <p className="font-body text-sm text-body/60 mt-1">This screen is being built next.</p>
    </div>
  </div>
)
export default Stub
