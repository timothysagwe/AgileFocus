export function calculateCoverage(progressData, certificationMap) {
  const completedExercises = progressData.completed_exercises || [];
  const completedSimulations = progressData.completed_simulations || [];
  const completedModules = progressData.completed_modules || [];
  const knowledgeCheckScores = progressData.knowledge_check_scores || {};

  const allCompletedIds = new Set([
    ...completedExercises,
    ...completedSimulations,
    ...completedModules
  ]);

  const domainResults = [];

  for (const domain of certificationMap.domains) {
    const coverageActivities = domain.coverage_activities || [];
    const activitiesMatched = coverageActivities.filter(id => allCompletedIds.has(id));
    const totalActivities = coverageActivities.length;
    const percentage = totalActivities > 0
      ? Math.round((activitiesMatched.length / totalActivities) * 100)
      : 0;

    const weightedContribution = Math.round((percentage * domain.weight) / 100);

    domainResults.push({
      domain_id: domain.domain_id,
      name: domain.name,
      percentage,
      weight: domain.weight,
      weighted_contribution: weightedContribution,
      activities_completed: activitiesMatched.length,
      activities_total: totalActivities,
      activities_matched: activitiesMatched
    });
  }

  const totalWeighted = domainResults.reduce((sum, d) => sum + d.weighted_contribution, 0);
  const totalWeight = domainResults.reduce((sum, d) => sum + d.weight, 0);
  const overallPercentage = totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 100) : 0;

  const knowledgeCheckKey = 'quiz-' + certificationMap.id;
  const quizScore = knowledgeCheckScores[knowledgeCheckKey];
  const quizBonus = (quizScore !== undefined && quizScore >= 70) ? 5 : 0;

  const finalPercentage = Math.min(100, overallPercentage + quizBonus);

  return {
    certification_id: certificationMap.id,
    certification_title: certificationMap.title,
    overall_percentage: finalPercentage,
    base_percentage: overallPercentage,
    quiz_bonus: quizBonus,
    quiz_score: quizScore,
    domains: domainResults,
    total_domains: domainResults.length,
    domains_above_50: domainResults.filter(d => d.percentage >= 50).length
  };
}

export function calculateAllCertifications(progressData, certificationMaps) {
  const results = {};
  for (const certMap of certificationMaps) {
    results[certMap.id] = calculateCoverage(progressData, certMap);
  }
  return results;
}

export function getRecommendedNextActivity(progressData, certificationMaps) {
  const completedExercises = progressData.completed_exercises || [];
  const completedSimulations = progressData.completed_simulations || [];
  const completedModules = progressData.completed_modules || [];

  const allCompletedIds = new Set([
    ...completedExercises,
    ...completedSimulations,
    ...completedModules
  ]);

  const activityCount = {};
  const activityDetails = {};

  for (const certMap of certificationMaps) {
    for (const domain of certMap.domains) {
      for (const activityId of domain.coverage_activities || []) {
        if (allCompletedIds.has(activityId)) continue;

        if (!activityCount[activityId]) {
          activityCount[activityId] = {
            count: 0,
            domains: [],
            certifications: []
          };
        }
        activityCount[activityId].count++;
        activityCount[activityId].domains.push({
          certification: certMap.title,
          domain: domain.name
        });
        if (!activityCount[activityId].certifications.includes(certMap.title)) {
          activityCount[activityId].certifications.push(certMap.title);
        }
      }
    }
  }

  const activityLabels = {
    'tier1-benefit-claim': { name: 'Benefit Claim BPMN Exercise', type: 'BPMN', time: '20 min', link: '/bpmn/tier1-benefit-claim' },
    'tier2-it-change-request': { name: 'IT Change Request BPMN Exercise', type: 'BPMN', time: '25 min', link: '/bpmn/tier2-it-change-request' },
    'tier3-mortgage-application': { name: 'Mortgage Application BPMN Exercise', type: 'BPMN', time: '30 min', link: '/bpmn/tier3-mortgage-application' },
    'meridian-fraud-triage': { name: 'Meridian Bank Fraud Simulation', type: 'Simulation', time: '45 min', link: '/simulator/meridian-fraud-triage' },
    'governance-topic-1': { name: 'CAB Framework', type: 'Module', time: '30 min', link: '/learn/governance/topic-1' },
    'governance-topic-2': { name: 'Definition of Done', type: 'Module', time: '25 min', link: '/learn/governance/topic-2' },
    'governance-topic-3': { name: 'Traceability', type: 'Module', time: '35 min', link: '/learn/governance/topic-3' },
    'governance-topic-4': { name: 'Release Management', type: 'Module', time: '30 min', link: '/learn/governance/topic-4' },
    'governance-topic-5': { name: 'Evidence Packs', type: 'Module', time: '40 min', link: '/learn/governance/topic-5' },
    'governance-topic-6': { name: 'DORA and Resilience', type: 'Module', time: '35 min', link: '/learn/governance/topic-6' }
  };

  const sorted = Object.entries(activityCount)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([id, data]) => ({
      activity_id: id,
      label: activityLabels[id] || { name: id, type: 'Unknown', time: '?', link: '#' },
      domains_improved: data.count,
      certifications: data.certifications,
      domains: data.domains
    }));

  return sorted;
}
