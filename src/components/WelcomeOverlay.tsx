/**
 * Welcome Overlay
 * Shown at the start of player creation. Introduces the game,
 * includes a WIP disclaimer, and shows an expandable progress section.
 */

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { GAME_PROGRESS } from '../data/progress';

interface WelcomeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ isOpen, onClose }) => {
  const [progressExpanded, setProgressExpanded] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Welcome to my Tennis RPG demo" size="xl" showCloseButton={false}>
      {/* Welcome */}
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🎾</div>
          <p className="text-pixel-text leading-relaxed">
            Rise from amateur circuits to the top of the world rankings. Train your
            skills, navigate rivalries, compete in tournaments, and write your own
            tennis story.
          </p>
        </div>

        {/* How to play blurb */}
        <div className="bg-pixel-card border-4 border-pixel-border p-4 space-y-2">
          <h3 className="text-pixel-accent font-bold text-lg">How it works</h3>
          <ul className="text-pixel-text-muted space-y-1 list-none">
            <li>→ Each day you choose how to spend your time: train, compete, or rest</li>
            <li>→ Story events and rivalries will interrupt your routine</li>
            <li>→ Win matches to climb the rankings and unlock new challenges</li>
          </ul>
          <br />
          <p className="text-pixel-text-muted text-sm leading-relaxed">
            Your stats and your playstyle affect the outcome on every point. Every serve,
            every forehand, and every defensive slice are individually computed to create
            realistic rallies with a variety of outcomes.
          </p>
          <p className="text-pixel-text-muted text-sm leading-relaxed">
            Stronger stats will impact a player's success rate AND their shot selection. Baseliners
            rip the ball at you with groundstrokes, while volleyers come up the court. Your 
            opponent's stats, the match environment, and your stamina will also affect your performance.
          </p>
        </div>

        {/* WIP disclaimer */}
        <div className="bg-pixel-bg border-4 border-pixel-warning p-4 space-y-2">
          <h3 className="text-pixel-warning font-bold text-lg">Work in Progress</h3>
          <p className="text-pixel-text-muted text-sm leading-relaxed">
            This is a personal side project under active development. Expect rough
            edges, placeholder content, and the occasional broken thing. Some
            narrative text, dialogue, and game code is AI-generated. Keep an eye out for
            the [AI-gen] tag.
          </p>
          <p className="text-pixel-text-muted text-sm leading-relaxed">
            Thanks for giving this a try, and feel free to contact me with any feedback. My
            goal is to eventually replace all the AI events. If you have any funny tennis stories
            you'd like to see enshrined in history, send them my way.
          </p>
        </div>

        {/* Expandable progress section */}
        <div className="border-4 border-pixel-border">
          <button
            className="w-full flex items-center justify-between p-4 bg-pixel-card text-pixel-text font-bold hover:bg-pixel-secondary transition-colors"
            onClick={() => setProgressExpanded((v) => !v)}
          >
            <span>Current implementation progress</span>
            <span className="text-xl">{progressExpanded ? '▲' : '▼'}</span>
          </button>

          {progressExpanded && (
            <div className="p-4 space-y-5">
              {GAME_PROGRESS.map((section) => (
                <div key={section.title}>
                  <h4 className="text-pixel-accent font-bold text-sm mb-2">
                    {section.title}
                  </h4>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-pixel text-sm mb-1">
                          <span>{item.label}</span>
                          <span>{item.percent}%</span>
                        </div>
                        <div className="w-full bg-pixel-bg border-2 border-pixel-border h-3">
                          <div
                            className="h-full bg-pixel-accent"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                        {item.notes && (
                          <p className="text-pixel-text-muted text-xs mt-1">{item.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <Button variant="primary" size="lg" fullWidth onClick={onClose}>
          Start Your Journey
        </Button>
      </div>
    </Modal>
  );
};
