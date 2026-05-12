import exercisesIndex from '../data/bpmn-exercises/index.json';

import tier1Json from '../data/bpmn-exercises/tier1-benefit-claim.json';
import tier2Json from '../data/bpmn-exercises/tier2-it-change-request.json';
import tier3Json from '../data/bpmn-exercises/tier3-mortgage-application.json';

import tier1ModelUrl from '../data/bpmn-exercises/models/tier1-benefit-claim-answer.bpmn';
import tier2ModelUrl from '../data/bpmn-exercises/models/tier2-it-change-answer.bpmn';
import tier3ModelUrl from '../data/bpmn-exercises/models/tier3-mortgage-errors.bpmn';

const exerciseData = {
  'tier1-benefit-claim': tier1Json,
  'tier2-it-change-request': tier2Json,
  'tier3-mortgage-application': tier3Json
};

const modelUrls = {
  'tier1-benefit-claim': tier1ModelUrl,
  'tier2-it-change-request': tier2ModelUrl,
  'tier3-mortgage-application': tier3ModelUrl
};

export function getExercises() {
  return exercisesIndex.map(filename => {
    const id = filename.replace('.json', '');
    return exerciseData[id] || null;
  }).filter(Boolean);
}

export function getExercise(id) {
  return exerciseData[id] || null;
}

export async function getModelXml(exerciseId) {
  const url = modelUrls[exerciseId];
  if (!url) return '';
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  }
}
