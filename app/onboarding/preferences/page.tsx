'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, ArrowLeft, ArrowRight } from 'lucide-react';
import { seedUserData } from './actions';

type HouseholdContext = 'just-me' | 'couple' | 'family' | null;
type AIStyle = 'coach' | 'collaborator' | null;

interface UserPreferences {
  household_context: HouseholdContext;
  dietary_constraints: string[];
  ai_style: AIStyle;
  planning_preferences: string[];
  ai_learning_enabled: boolean;
}

const TOTAL_STEPS = 6;

export default function OnboardingPreferencesPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState<UserPreferences>({
    household_context: null,
    dietary_constraints: [],
    ai_style: null,
    planning_preferences: [],
    ai_learning_enabled: true,
  });

  const [newConstraint, setNewConstraint] = useState('');
  const [showAddConstraint, setShowAddConstraint] = useState(false);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSkip = async () => {
    // Apply safe defaults and save
    const defaultPreferences: UserPreferences = {
      household_context: 'couple',
      dietary_constraints: [],
      ai_style: 'collaborator',
      planning_preferences: ['No strong preference'],
      ai_learning_enabled: true,
    };

    await savePreferences(defaultPreferences);
  };

  const handleFinish = async () => {
    await savePreferences(preferences);
  };

  const savePreferences = async (prefs: UserPreferences) => {
    try {
      setSaving(true);

      // Save preferences
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        console.error('Failed to save preferences');
        setSaving(false);
        return;
      }

      // Seed example recipes and default grocery list
      const seedResult = await seedUserData();
      if (seedResult.error) {
        console.error('Failed to seed user data:', seedResult.error);
      }

      // Redirect to recipes page
      router.push('/recipes');
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaving(false);
    }
  };

  const toggleDietaryConstraint = (constraint: string) => {
    setPreferences((prev) => ({
      ...prev,
      dietary_constraints: prev.dietary_constraints.includes(constraint)
        ? prev.dietary_constraints.filter((c) => c !== constraint)
        : [...prev.dietary_constraints, constraint],
    }));
  };

  const addCustomConstraint = () => {
    if (newConstraint.trim() && !preferences.dietary_constraints.includes(newConstraint.trim())) {
      setPreferences((prev) => ({
        ...prev,
        dietary_constraints: [...prev.dietary_constraints, newConstraint.trim()],
      }));
      setNewConstraint('');
      setShowAddConstraint(false);
    }
  };

  const togglePlanningPreference = (pref: string) => {
    setPreferences((prev) => ({
      ...prev,
      planning_preferences: prev.planning_preferences.includes(pref)
        ? prev.planning_preferences.filter((p) => p !== pref)
        : [...prev.planning_preferences, pref],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return preferences.household_context !== null;
      case 2:
        return true; // Dietary constraints are optional
      case 3:
        return preferences.ai_style !== null;
      case 4:
        return true; // Planning preferences are optional
      case 5:
        return true; // AI learning has a default
      case 6:
        return true; // Summary is always ready
      default:
        return false;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Progress */}
      <div style={{
        backgroundColor: '#f97316',
        color: 'white',
        padding: '20px 16px',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
          <ChefHat size={32} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', textAlign: 'center', marginBottom: '8px' }}>
          Let's set up your MealBrain
        </h1>
        <p style={{ fontSize: '14px', textAlign: 'center', opacity: 0.9 }}>
          Step {currentStep} of {TOTAL_STEPS}
        </p>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderRadius: '2px',
          marginTop: '12px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(currentStep / TOTAL_STEPS) * 100}%`,
            height: '100%',
            backgroundColor: 'white',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '24px 16px', paddingBottom: '100px' }}>
        {currentStep === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              Who is this app for?
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
              This helps with portion sizing and meal volume
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(['just-me', 'couple', 'family'] as const).map((context) => (
                <button
                  key={context}
                  onClick={() => setPreferences((prev) => ({ ...prev, household_context: context }))}
                  style={{
                    padding: '16px',
                    backgroundColor: preferences.household_context === context ? '#fff7ed' : 'white',
                    border: preferences.household_context === context ? '2px solid #f97316' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    color: '#111827',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: preferences.household_context === context ? '600' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  {context === 'just-me' && 'Just me'}
                  {context === 'couple' && 'Me + spouse/partner'}
                  {context === 'family' && 'Household with kids'}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              Any dietary constraints?
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
              Select all that apply (soft constraints by default)
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {['Dairy-free', 'Vegetarian', 'Vegan', 'Gluten-free', 'Nut allergy'].map((constraint) => (
                <button
                  key={constraint}
                  onClick={() => toggleDietaryConstraint(constraint)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: preferences.dietary_constraints.includes(constraint) ? '#f97316' : 'white',
                    color: preferences.dietary_constraints.includes(constraint) ? 'white' : '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '24px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: preferences.dietary_constraints.includes(constraint) ? '500' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  {constraint}
                </button>
              ))}
              {preferences.dietary_constraints
                .filter((c) => !['Dairy-free', 'Vegetarian', 'Vegan', 'Gluten-free', 'Nut allergy'].includes(c))
                .map((constraint) => (
                  <button
                    key={constraint}
                    onClick={() => toggleDietaryConstraint(constraint)}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: '#f97316',
                      color: 'white',
                      border: 'none',
                      borderRadius: '24px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {constraint}
                  </button>
                ))}
            </div>
            {showAddConstraint ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newConstraint}
                  onChange={(e) => setNewConstraint(e.target.value)}
                  placeholder="Add custom constraint"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') addCustomConstraint();
                  }}
                />
                <button
                  onClick={addCustomConstraint}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddConstraint(true)}
                style={{
                  padding: '10px 18px',
                  backgroundColor: 'white',
                  color: '#f97316',
                  border: '1px solid #f97316',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                + Add custom
              </button>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              How would you like the AI to work with you?
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
              This affects tone and verbosity only, never authority
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                {
                  value: 'coach' as const,
                  label: 'Coach',
                  desc: 'Explains reasoning, offers guidance, slower and more thoughtful'
                },
                {
                  value: 'collaborator' as const,
                  label: 'Collaborator',
                  desc: 'Proposes concrete plans, focuses on momentum, still asks before changes'
                },
              ].map((style) => (
                <button
                  key={style.value}
                  onClick={() => setPreferences((prev) => ({ ...prev, ai_style: style.value }))}
                  style={{
                    padding: '16px',
                    backgroundColor: preferences.ai_style === style.value ? '#fff7ed' : 'white',
                    border: preferences.ai_style === style.value ? '2px solid #f97316' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>
                    {style.label}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {style.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              How do you usually plan meals?
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
              Select all that apply (optional)
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Week-by-week', 'A few days at a time', 'Batch cooking', 'Reuse leftovers', 'No strong preference'].map((pref) => (
                <button
                  key={pref}
                  onClick={() => togglePlanningPreference(pref)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: preferences.planning_preferences.includes(pref) ? '#f97316' : 'white',
                    color: preferences.planning_preferences.includes(pref) ? 'white' : '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '24px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: preferences.planning_preferences.includes(pref) ? '500' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              Should the AI learn from your choices?
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
              The AI will always ask before applying any learned patterns
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => setPreferences((prev) => ({ ...prev, ai_learning_enabled: true }))}
                style={{
                  padding: '16px',
                  backgroundColor: preferences.ai_learning_enabled ? '#fff7ed' : 'white',
                  border: preferences.ai_learning_enabled ? '2px solid #f97316' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>
                  Yes
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Suggest patterns, always ask before applying
                </div>
              </button>
              <button
                onClick={() => setPreferences((prev) => ({ ...prev, ai_learning_enabled: false }))}
                style={{
                  padding: '16px',
                  backgroundColor: !preferences.ai_learning_enabled ? '#fff7ed' : 'white',
                  border: !preferences.ai_learning_enabled ? '2px solid #f97316' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  No
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Don't learn from my behavior
                </div>
              </button>
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
              Let's confirm your preferences
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
              You can change these anytime in Settings
            </p>

            <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#f97316',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px'
                }}>
                  Household
                </h3>
                <p style={{ fontSize: '14px', color: '#111827' }}>
                  {preferences.household_context === 'just-me' && 'Just me'}
                  {preferences.household_context === 'couple' && 'Me + spouse/partner'}
                  {preferences.household_context === 'family' && 'Household with kids'}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#f97316',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px'
                }}>
                  Dietary Constraints
                </h3>
                <p style={{ fontSize: '14px', color: '#111827' }}>
                  {preferences.dietary_constraints.length > 0
                    ? preferences.dietary_constraints.join(', ')
                    : 'None'}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#f97316',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px'
                }}>
                  AI Style
                </h3>
                <p style={{ fontSize: '14px', color: '#111827' }}>
                  {preferences.ai_style === 'coach' && 'Coach'}
                  {preferences.ai_style === 'collaborator' && 'Collaborator'}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#f97316',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px'
                }}>
                  Planning Style
                </h3>
                <p style={{ fontSize: '14px', color: '#111827' }}>
                  {preferences.planning_preferences.length > 0
                    ? preferences.planning_preferences.join(', ')
                    : 'No preferences set'}
                </p>
              </div>

              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#f97316',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px'
                }}>
                  AI Learning
                </h3>
                <p style={{ fontSize: '14px', color: '#111827' }}>
                  {preferences.ai_learning_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '16px',
        display: 'flex',
        gap: '12px',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={handleSkip}
          disabled={saving}
          style={{
            padding: '12px 20px',
            backgroundColor: 'white',
            color: '#6b7280',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.5 : 1
          }}
        >
          Skip for now
        </button>

        <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              disabled={saving}
              style={{
                padding: '12px 16px',
                backgroundColor: 'white',
                color: '#f97316',
                border: '1px solid #f97316',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: saving ? 0.5 : 1
              }}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          )}

          {currentStep < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={!canProceed() || saving}
              style={{
                padding: '12px 20px',
                backgroundColor: canProceed() && !saving ? '#f97316' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: canProceed() && !saving ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              style={{
                padding: '12px 24px',
                backgroundColor: saving ? '#d1d5db' : '#f97316',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Get Started'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
