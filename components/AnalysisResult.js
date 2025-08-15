// components/AnalysisResult.js
import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import {
  FaRegNewspaper,
  FaClipboardCheck,
  FaBalanceScale,
  FaCheckCircle,
  FaExclamationTriangle,
  FaListAlt,
  FaChevronDown,
  FaCopy,
  FaShare,
  FaTimesCircle,
} from 'react-icons/fa';

export default function AnalysisResult({ analysis }) {
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    credibility: true,
    type: true,
    bias: true,
  });
  const [animateIn, setAnimateIn] = useState(false);
  const [copiedSection, setCopiedSection] = useState(null);

  const contentRefs = useRef({});

  useEffect(() => {
    if (analysis?.synthesis) {
      // Slight delay for smoother entrance animation
      setTimeout(() => setAnimateIn(true), 100);
    }
  }, [analysis]);

  if (!analysis?.synthesis || analysis.synthesis.error) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-4 p-6 text-center text-gray-500 dark:text-gray-400">
        <div className="space-y-4 animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 h-6 w-3/4 mx-auto rounded-lg"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-4 w-1/2 mx-auto rounded-lg"></div>
        </div>
      </div>
    );
  }

  const {
    summary,
    primary_classification,
    secondary_classification,
    tertiary_classification,
  } = analysis.synthesis;

  // SANITIZE ALL LLM-GENERATED CONTENT
  const sanitizedSummary = DOMPurify.sanitize(summary);
  const sanitizedPrimaryQuote = DOMPurify.sanitize(primary_classification?.quote || '');
  const sanitizedPrimaryReason = DOMPurify.sanitize(primary_classification?.llm_reason || '');
  const sanitizedSecondaryQuote = DOMPurify.sanitize(secondary_classification?.quote || '');
  const sanitizedSecondaryReason = DOMPurify.sanitize(secondary_classification?.llm_reason || '');
  const sanitizedTertiaryQuote = DOMPurify.sanitize(tertiary_classification?.quote || '');
  const sanitizedTertiaryReason = DOMPurify.sanitize(tertiary_classification?.llm_reason || '');

  const toggleSection = (section) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const toggleAllSections = () => {
    const allExpanded = Object.values(expandedSections).every(Boolean);
    const newState = !allExpanded;
    setExpandedSections({
      summary: newState,
      credibility: newState,
      type: newState,
      bias: newState,
    });
  };

  const copyToClipboard = async (text, section) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareAnalysis = async () => {
    const currentUrl = window.location.href;
    const fullReport = `Analysis Report

URL: ${currentUrl}

Summary: "${sanitizedSummary}"

Credibility: ${primary_classification?.type?.replace('_', ' ')}
Quote: "${sanitizedPrimaryQuote}"

Type: ${secondary_classification?.type?.replace('_', ' ')}
Quote: "${sanitizedSecondaryQuote}"

${tertiary_classification
        ? `Political Bias: ${tertiary_classification.type.replace('_', ' ')}
Quote: "${sanitizedTertiaryQuote}"`
        : ''
      }`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Analysis Report',
          text: fullReport,
          url: currentUrl,
        });
        return;
      } catch {
        // Fall through to copy on cancel
      }
    }
    copyToClipboard(fullReport, 'share');
  };

  const getSectionText = (sectionKey) => {
    const textMap = {
      summary: `Summary: "${sanitizedSummary}"`,
      credibility: `Credibility: ${primary_classification?.type?.replace('_', ' ')}\nQuote: "${sanitizedPrimaryQuote}"`,
      type: `Type: ${secondary_classification?.type?.replace('_', ' ')}\nQuote: "${sanitizedSecondaryQuote}"`,
      bias: tertiary_classification
        ? `Political Bias: ${tertiary_classification.type.replace('_', ' ')}\nQuote: "${sanitizedTertiaryQuote}"`
        : '',
    };
    return textMap[sectionKey] || '';
  };

  const renderConfidence = (llmConfidence, llmReason, llmPositive) => {
    const hasLLM = llmConfidence != null;
    const hasReason = !!llmReason;

    if (!hasLLM && !hasReason) return null;

    const toPct = (v) => Math.round((v ?? 0) * 100);

    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600/50">
        {hasLLM && (
          <div className="flex flex-col md:flex-row justify-between">
            <span className="font-medium">CheckMatic Confidence:</span>
            <div className="flex items-center space-x-3">
              <div className="relative w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${toPct(llmConfidence)}%` }}
                />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {toPct(llmConfidence)}%
              </span>
            </div>
          </div>
        )}

        {hasReason && (
          <div className="mt-2">
            <div
              className={`p-4 rounded-xl text-[11px] border transition-all duration-300 ${llmPositive
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 md:text-base text-xs'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 md:text-base text-xs'
                }`}
            >
              <p
                className="leading-relaxed"
                dangerouslySetInnerHTML={{ __html: llmReason }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title, icon, content, sectionKey) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="mb-6 last:mb-0">
        <div className="group flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600/50 hover:bg-gray-100 dark:hover:bg-gray-700/70 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 ease-out">
          <button
            onClick={() => toggleSection(sectionKey)}
            className="flex items-center flex-1 text-left"
          >
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-600/50 transition-all duration-300 group-hover:shadow-md">
              {icon}
            </div>
            <h3 className="text-md sm:text-xl font-semibold ml-2 text-gray-800 dark:text-gray-200 transition-colors duration-300">
              {title}
            </h3>
          </button>

          <div className="flex md:items-center md:space-x-2 space-x-1">
            <button
              onClick={() => copyToClipboard(getSectionText(sectionKey), sectionKey)}
              className="md:p-2.5 rounded-xl text-gray-400 hover:text-indigo-400 dark:hover:text-indigo-600 group-hover:opacity-100 transition-all duration-300 hover:bg-white dark:hover:bg-gray-800"
              title="Copy section"
            >
              {copiedSection === sectionKey ? (
                <FaClipboardCheck className="md:h-5 md:w-5 text-green-500" />
              ) : (
                <FaCopy className="md:h-5 md:w-5" />
              )}
            </button>
            <button
              onClick={() => toggleSection(sectionKey)}
              className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-300 hover:bg-white dark:hover:bg-gray-800"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <FaChevronDown
                className={`md:h-5 md:w-5 transition-transform duration-500 ease-out ${isExpanded ? 'rotate-180' : ''
                  }`}
              />
            </button>
          </div>
        </div>

        <div
          className={`transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] overflow-hidden ${isExpanded ? 'opacity-100 mt-4' : 'opacity-0 mt-0'
            }`}
          style={{
            maxHeight: isExpanded
              ? contentRefs.current[sectionKey]?.scrollHeight + 'px'
              : '0px'
          }}
        >
          <div
            ref={(el) => {
              if (el) contentRefs.current[sectionKey] = el;
            }}
            className="px-4"
          >
            {content}
          </div>
        </div>
      </div>
    );
  };

  const getCredibilityIcon = () => {
    const credibilityType = primary_classification?.type;

    if (credibilityType === 'satirical') {
      return <FaExclamationTriangle className="h-5 w-5 text-yellow-500" />;
    }

    if (credibilityType === 'fake') {
      return <FaTimesCircle className="h-5 w-5 text-red-500" />;
    }

    return <FaCheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getCredibilityBadge = () => {
    const isAuthentic = primary_classification?.type === 'authentic';
    return (
      <span
        className={`font-bold capitalize px-3 py-1 rounded-full md:text-base text-xs transition-all duration-300 ${isAuthentic
          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
          }`}
      >
        {primary_classification?.type?.replace('_', ' ')}
      </span>
    );
  };

  const getTypeBadge = () => {
    const isSatire = secondary_classification?.type === 'satire';
    return (
      <span
        className={`font-bold capitalize px-3 py-1 rounded-full md:text-base text-xs transition-all duration-300 ${isSatire
          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
          }`}
      >
        {secondary_classification?.type?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div
      className={`w-full max-w-2xl mx-auto mt-4 transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${animateIn
        ? 'translate-y-0 opacity-100 scale-100'
        : 'translate-y-12 opacity-0 scale-95'
        }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 ml-2 mr-2 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-indigo-300 flex items-center">

            Analysis
          </h2>

          <div className="flex items-center">
            <button
              onClick={shareAnalysis}
              className="flex items-center px-2 sm:px-2 py-2 sm:py-2.5 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-md transition-all duration-300 hover:shadow-md"
            >
              {copiedSection === 'share' ? (
                <>
                  <FaCheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  <span className="text-green-500 text-xs sm:text-sm font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <FaShare className="h-4 w-4 sm:h-5 sm:w-5" />
                </>
              )}
            </button>

            <button
              onClick={toggleAllSections}
              className="flex items-center px-2 sm:px-4 py-2 sm:py-2.5 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-md transition-all duration-300 hover:shadow-md"
              title={Object.values(expandedSections).every(Boolean) ? 'Collapse all' : 'Expand all'}
            >
              <FaChevronDown
                className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-500 ease-out ${Object.values(expandedSections).every(Boolean) ? 'rotate-180' : ''
                  }`}
              />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {renderSection(
            'Summary',
            <FaListAlt className="h-5 w-5 text-indigo-500" />,
            <p
              className="md:text-base text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed"
              dangerouslySetInnerHTML={{ __html: `"${sanitizedSummary}"` }}
            />,
            'summary'
          )}

          {/* Credibility Section */}
          {renderSection(
            'Credibility',
            getCredibilityIcon(),
            <div className="mt-1">
              <p className="md:text-base text-xs">
                This article is likely {getCredibilityBadge()}
              </p>

              {renderConfidence(
                primary_classification?.llm_confidence ?? null,
                sanitizedPrimaryReason,
                primary_classification?.llm_positive ?? false
              )}

              <blockquote
                className="mt-4 p-4 md:text-base text-[11px] bg-gray-50 dark:bg-gray-700/30 border-l-4 border-fuchsia-600 rounded-r-xl italic text-gray-600 dark:text-gray-400 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: `&quot;${sanitizedPrimaryQuote}&quot;` }}
              />
            </div>,
            'credibility'
          )}

          {/* Type Section */}
          {renderSection(
            'Type',
            <FaRegNewspaper className="h-5 w-5 text-indigo-500" />,
            <div className="mt-1">
              <p className="md:text-base text-xs">
                It appears to be {getTypeBadge()}
              </p>

              {renderConfidence(
                secondary_classification?.llm_confidence ?? null,
                sanitizedSecondaryReason,
                secondary_classification?.llm_positive ?? false
              )}

              <blockquote
                className="mt-4 p-4 md:text-base text-[11px] bg-gray-50 dark:bg-gray-700/30 border-l-4 border-fuchsia-500 rounded-r-xl italic text-gray-600 dark:text-gray-400 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: `&quot;${sanitizedSecondaryQuote}&quot;` }}
              />
            </div>,
            'type'
          )}

          {/* Political Bias Section */}
          {tertiary_classification &&
            renderSection(
              'Political Bias',
              <FaBalanceScale className="h-5 w-5 text-indigo-500" />,
              <div className="mt-1">
                <p className="md:text-base text-xs">
                  The article has a{' '}
                  <span className="font-bold capitalize px-3 py-1 rounded-full md:text-base text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 transition-all duration-300">
                    {tertiary_classification.type.replace('_', ' ')}
                  </span>{' '}
                  bias.
                </p>

                {renderConfidence(
                  tertiary_classification?.llm_confidence ?? null,
                  sanitizedTertiaryReason,
                  tertiary_classification?.llm_positive ?? false
                )}

                <blockquote
                  className="mt-4 p-4 md:text-base text-[11px] bg-gray-50 dark:bg-gray-700/30 border-l-4 border-fuchsia-400 rounded-r-xl italic text-gray-600 dark:text-gray-400 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: `&quot;${sanitizedTertiaryQuote}&quot;` }}
                />
              </div>,
              'bias'
            )}
        </div>
        <div className="flex flex-col mt-1 mb-4 text-center text-xs md:text-sm text-gray-500 dark:text-gray-400">
          <p>CheckMatic can make mistakes.</p>
        </div>
      </div>
    </div>
  );
}