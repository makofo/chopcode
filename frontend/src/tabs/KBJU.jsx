import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import ProfileForm from "./ProfileForm.jsx";
import ProgressBar from "../ProgressBar.jsx";
import { useVoiceInput } from "../useVoiceInput.js";

const S = {
  title: "\u041a\u0411\u0416\u0423 \u0441\u0435\u0433\u043e\u0434\u043d\u044f",
  norm: "\u041d\u043e\u0440\u043c\u0430 \u043d\u0430 \u0434\u0435\u043d\u044c",
  edit: "\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b",
  calories: "\u041a\u0430\u043b\u043e\u0440\u0438\u0438",
  protein: "\u0411\u0435\u043b\u043a\u0438",
  fat: "\u0416\u0438\u0440\u044b",
  carbs: "\u0423\u0433\u043b\u0435\u0432\u043e\u0434\u044b",
  addMeal: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u0440\u0438\u0451\u043c \u043f\u0438\u0449\u0438",
  searchPh: "\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u0430, \u043d\u0430\u043f\u0440. \u0433\u0440\u0435\u0447\u043a\u0430",
  gram: "\u0413\u0440\u0430\u043c\u043c\u044b",
  per100: "\u043a\u043a\u0430\u043b / 100 \u0433",
  add: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c",
  manual: "\u041d\u0435\u0442 \u0432 \u0431\u0430\u0437\u0435? \u0412\u0432\u0435\u0441\u0442\u0438 \u0432\u0440\u0443\u0447\u043d\u0443\u044e",
  back: "\u2190 \u041d\u0430\u0437\u0430\u0434 \u043a \u043f\u043e\u0438\u0441\u043a\u0443",
  namePh: "\u0427\u0442\u043e \u0441\u044a\u0435\u043b(\u0430)?",
  kcalPh: "\u041a\u043a\u0430\u043b",
  pPh: "\u0411\u0435\u043b\u043a\u0438, \u0433",
  fPh: "\u0416\u0438\u0440\u044b, \u0433",
  cPh: "\u0423\u0433\u043b\u0435\u0432\u043e\u0434\u044b, \u0433",
  empty: "\u0421\u0435\u0433\u043e\u0434\u043d\u044f \u0435\u0449\u0451 \u043d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u043e",
  nothing: "\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e \u2014 \u043c\u043e\u0436\u043d\u043e \u0432\u0432\u0435\u0441\u0442\u0438 \u0432\u0440\u0443\u0447\u043d\u0443\u044e",
  kcal: "\u043a\u043a\u0430\u043b",
  g: "\u0433",
  mic: "\ud83c\udfa4",
  plate: "\ud83c\udf7d\ufe0f",
  del: "\u00d7",
  dot: " \u00b7 ",
  pL: "\u0431\u0435\u043b\u043a\u0438",
  fL: "\u0436\u0438\u0440\u044b",
  cL: "\u0443\u0433\u043b\u0435\u0432.",
  pS: "\u0411",
  fS: "\u0416",
  cS: "\u0423",
  suffix: "\u043f\u043e\u0434\u0440\u044f\u0434",
  streakStart: "\u041d\u0430\u0447\u043d\u0438 \u0441\u0435\u0440\u0438\u044e",
  dayOne: "\u0434\u0435\u043d\u044c",
  dayFew: "\u0434\u043d\u044f",
  dayMany: "\u0434\u043d\u0435\u0439",
  sub0: "\u041e\u0442\u043c\u0435\u0447\u0430\u0439 \u0435\u0434\u0443 \u043a\u0430\u0436\u0434\u044b\u0439 \u0434\u0435\u043d\u044c \u2014 \u0440\u0430\u0441\u0442\u0438 \u043e\u0433\u043e\u043d\u0451\u043a!",
  subKeep: "\u0422\u0430\u043a \u0434\u0435\u0440\u0436\u0430\u0442\u044c, \u0442\u044b \u0441\u0435\u0433\u043e\u0434\u043d\u044f \u0432 \u0434\u0435\u043b\u0435! \ud83d\udcaa",
  subToday: "\u041e\u0442\u043c\u0435\u0442\u044c \u0435\u0434\u0443 \u0441\u0435\u0433\u043e\u0434\u043d\u044f, \u0447\u0442\u043e\u0431\u044b \u043d\u0435 \u043f\u043e\u0442\u0435\u0440\u044f\u0442\u044c \u0441\u0435\u0440\u0438\u044e",
  fire: "\ud83d\udd25",
};

function pluralDay(n) {
  const a = Math.abs(n) % 100;
  const b = n % 10;
  if (a >= 11 && a <= 14) return S.dayMany;
  if (b === 1) return S.dayOne;
  if (b >= 2 && b <= 4) return S.dayFew;
  return S.dayMany;
}

// Food database: kcal / protein / fat / carbs per 100 g
const FOOD = [
  ["\u041a\u0443\u0440\u0438\u043d\u043e\u0435 \u0444\u0438\u043b\u0435", 165, 31, 3.6, 0], ["\u041a\u0443\u0440\u0438\u043d\u043e\u0435 \u0431\u0435\u0434\u0440\u043e", 210, 17, 15, 0],
  ["\u0418\u043d\u0434\u0435\u0439\u043a\u0430 \u0444\u0438\u043b\u0435", 145, 22, 7, 0], ["\u0413\u043e\u0432\u044f\u0434\u0438\u043d\u0430", 250, 26, 17, 0],
  ["\u0421\u0432\u0438\u043d\u0438\u043d\u0430", 260, 16, 21, 0], ["\u0424\u0430\u0440\u0448 \u0433\u043e\u0432\u044f\u0436\u0438\u0439", 250, 17, 20, 0],
  ["\u041a\u043e\u0442\u043b\u0435\u0442\u0430", 260, 15, 20, 8], ["\u0421\u043e\u0441\u0438\u0441\u043a\u0430", 260, 11, 24, 2],
  ["\u041a\u043e\u043b\u0431\u0430\u0441\u0430 \u0432\u0430\u0440\u0451\u043d\u0430\u044f", 300, 12, 28, 1], ["\u0412\u0435\u0442\u0447\u0438\u043d\u0430", 280, 16, 24, 1],
  ["\u0411\u0435\u043a\u043e\u043d", 500, 37, 45, 1], ["\u041f\u0435\u043b\u044c\u043c\u0435\u043d\u0438 \u0432\u0430\u0440\u0451\u043d\u044b\u0435", 250, 12, 12, 25],
  ["\u041b\u043e\u0441\u043e\u0441\u044c", 200, 20, 13, 0], ["\u0421\u0451\u043c\u0433\u0430", 220, 20, 15, 0],
  ["\u0422\u0443\u043d\u0435\u0446 \u043a\u043e\u043d\u0441\u0435\u0440\u0432.", 100, 24, 1, 0], ["\u0422\u0440\u0435\u0441\u043a\u0430", 80, 18, 0.7, 0],
  ["\u041c\u0438\u043d\u0442\u0430\u0439", 72, 16, 0.9, 0], ["\u0421\u0435\u043b\u0451\u0434\u043a\u0430", 250, 17, 19, 0],
  ["\u041a\u0440\u0435\u0432\u0435\u0442\u043a\u0438", 95, 20, 1.8, 0], ["\u041a\u0440\u0430\u0431\u043e\u0432\u044b\u0435 \u043f\u0430\u043b\u043e\u0447\u043a\u0438", 90, 9, 1, 10],
  ["\u042f\u0439\u0446\u043e \u043a\u0443\u0440\u0438\u043d\u043e\u0435", 155, 13, 11, 1.1], ["\u041e\u043c\u043b\u0435\u0442", 180, 11, 15, 2],
  ["\u041c\u043e\u043b\u043e\u043a\u043e 2.5%", 52, 2.9, 2.5, 4.7], ["\u041a\u0435\u0444\u0438\u0440 1%", 40, 3, 1, 4],
  ["\u0422\u0432\u043e\u0440\u043e\u0433 5%", 120, 17, 5, 3], ["\u0422\u0432\u043e\u0440\u043e\u0433 9%", 160, 16, 9, 2],
  ["\u0422\u0432\u043e\u0440\u043e\u0433 \u043e\u0431\u0435\u0437\u0436\u0438\u0440.", 71, 18, 0.6, 1.8], ["\u0421\u043c\u0435\u0442\u0430\u043d\u0430 20%", 210, 2.8, 20, 3.2],
  ["\u0419\u043e\u0433\u0443\u0440\u0442 \u043d\u0430\u0442\u0443\u0440\u0430\u043b\u044c\u043d\u044b\u0439", 60, 5, 3.2, 3.5], ["\u0421\u044b\u0440 \u0442\u0432\u0451\u0440\u0434\u044b\u0439", 360, 25, 28, 0],
  ["\u0421\u044b\u0440 \u043f\u043b\u0430\u0432\u043b\u0435\u043d\u044b\u0439", 290, 10, 23, 4], ["\u0421\u043b\u0438\u0432\u043e\u0447\u043d\u043e\u0435 \u043c\u0430\u0441\u043b\u043e", 748, 0.5, 82, 0.8],
  ["\u041c\u043e\u0440\u043e\u0436\u0435\u043d\u043e\u0435", 210, 3.7, 11, 24],
  ["\u0413\u0440\u0435\u0447\u043a\u0430 \u0432\u0430\u0440\u0451\u043d\u0430\u044f", 110, 4, 1.1, 21], ["\u0420\u0438\u0441 \u0432\u0430\u0440\u0451\u043d\u044b\u0439", 116, 2.2, 0.5, 25],
  ["\u041e\u0432\u0441\u044f\u043d\u043a\u0430 \u043d\u0430 \u0432\u043e\u0434\u0435", 88, 3, 1.7, 15], ["\u041e\u0432\u0441\u044f\u043d\u043a\u0430 \u0441\u0443\u0445\u0430\u044f", 370, 12, 7, 62],
  ["\u041c\u0430\u043a\u0430\u0440\u043e\u043d\u044b \u0432\u0430\u0440\u0451\u043d\u044b\u0435", 130, 4, 1.1, 25], ["\u041f\u0448\u0435\u043d\u043e \u0432\u0430\u0440\u0451\u043d\u043e\u0435", 90, 3, 0.7, 17],
  ["\u041f\u0435\u0440\u043b\u043e\u0432\u043a\u0430 \u0432\u0430\u0440\u0451\u043d\u0430\u044f", 106, 3, 0.4, 22], ["\u0411\u0443\u043b\u0433\u0443\u0440 \u0432\u0430\u0440\u0451\u043d\u044b\u0439", 110, 3, 0.2, 23],
  ["\u041a\u0438\u043d\u043e\u0430 \u0432\u0430\u0440\u0451\u043d\u0430\u044f", 120, 4.4, 1.9, 21], ["\u041a\u0430\u0440\u0442\u043e\u0444\u0435\u043b\u044c \u0432\u0430\u0440\u0451\u043d\u044b\u0439", 82, 2, 0.4, 17],
  ["\u041a\u0430\u0440\u0442\u043e\u0444\u0435\u043b\u044c \u0436\u0430\u0440\u0435\u043d\u044b\u0439", 190, 2.8, 9.5, 23], ["\u041a\u0430\u0440\u0442\u043e\u0444\u0435\u043b\u044c \u0444\u0440\u0438", 310, 3.4, 15, 41],
  ["\u041f\u044e\u0440\u0435 \u043a\u0430\u0440\u0442\u043e\u0444\u0435\u043b\u044c\u043d\u043e\u0435", 90, 2, 3, 15],
  ["\u041e\u0433\u0443\u0440\u0435\u0446", 15, 0.8, 0.1, 2.8], ["\u041f\u043e\u043c\u0438\u0434\u043e\u0440", 20, 1.1, 0.2, 3.7],
  ["\u041a\u0430\u043f\u0443\u0441\u0442\u0430", 28, 1.8, 0.1, 4.7], ["\u0411\u0440\u043e\u043a\u043a\u043e\u043b\u0438", 34, 2.8, 0.4, 7],
  ["\u041c\u043e\u0440\u043a\u043e\u0432\u044c", 35, 1.3, 0.1, 7], ["\u0421\u0432\u0451\u043a\u043b\u0430", 43, 1.5, 0.1, 9],
  ["\u041b\u0443\u043a \u0440\u0435\u043f\u0447\u0430\u0442\u044b\u0439", 41, 1.4, 0, 8], ["\u041f\u0435\u0440\u0435\u0446 \u0431\u043e\u043b\u0433\u0430\u0440\u0441\u043a\u0438\u0439", 27, 1.3, 0, 5],
  ["\u041a\u0430\u0431\u0430\u0447\u043e\u043a", 24, 0.6, 0.3, 4.6], ["\u0411\u0430\u043a\u043b\u0430\u0436\u0430\u043d", 24, 1.2, 0.1, 4.5],
  ["\u0422\u044b\u043a\u0432\u0430", 26, 1, 0.1, 4.4], ["\u041a\u0443\u043a\u0443\u0440\u0443\u0437\u0430", 96, 3.4, 1.5, 19],
  ["\u0413\u043e\u0440\u043e\u0448\u0435\u043a \u0437\u0435\u043b\u0451\u043d\u044b\u0439", 81, 5, 0.4, 14], ["\u0424\u0430\u0441\u043e\u043b\u044c \u0432\u0430\u0440\u0451\u043d\u0430\u044f", 123, 7.8, 0.5, 21],
  ["\u0410\u0432\u043e\u043a\u0430\u0434\u043e", 160, 2, 15, 9], ["\u0428\u0430\u043c\u043f\u0438\u043d\u044c\u043e\u043d\u044b", 22, 4.3, 1, 0.1],
  ["\u042f\u0431\u043b\u043e\u043a\u043e", 47, 0.4, 0.4, 10], ["\u0411\u0430\u043d\u0430\u043d", 90, 1.5, 0.2, 21],
  ["\u0410\u043f\u0435\u043b\u044c\u0441\u0438\u043d", 43, 0.9, 0.2, 8], ["\u041c\u0430\u043d\u0434\u0430\u0440\u0438\u043d", 38, 0.8, 0.2, 7.5],
  ["\u0413\u0440\u0443\u0448\u0430", 47, 0.4, 0.3, 10], ["\u0412\u0438\u043d\u043e\u0433\u0440\u0430\u0434", 65, 0.6, 0.2, 16],
  ["\u041a\u043b\u0443\u0431\u043d\u0438\u043a\u0430", 33, 0.7, 0.3, 7], ["\u0427\u0435\u0440\u043d\u0438\u043a\u0430", 44, 1.1, 0.4, 8],
  ["\u041c\u0430\u043b\u0438\u043d\u0430", 46, 1.2, 0.7, 8], ["\u0410\u0440\u0431\u0443\u0437", 30, 0.6, 0.1, 8],
  ["\u0414\u044b\u043d\u044f", 34, 0.6, 0.3, 7], ["\u041f\u0435\u0440\u0441\u0438\u043a", 40, 0.9, 0.1, 9],
  ["\u041a\u0438\u0432\u0438", 47, 1, 0.5, 9], ["\u0410\u043d\u0430\u043d\u0430\u0441", 50, 0.5, 0.1, 12],
  ["\u0413\u0440\u0430\u043d\u0430\u0442", 72, 0.7, 0.6, 15], ["\u0425\u0443\u0440\u043c\u0430", 67, 0.5, 0.4, 15],
  ["\u0413\u0440\u0435\u0446\u043a\u0438\u0439 \u043e\u0440\u0435\u0445", 650, 15, 65, 11], ["\u041c\u0438\u043d\u0434\u0430\u043b\u044c", 575, 21, 54, 13],
  ["\u041a\u0435\u0448\u044c\u044e", 550, 18, 44, 30], ["\u0410\u0440\u0430\u0445\u0438\u0441", 550, 26, 45, 10],
  ["\u0424\u0443\u043d\u0434\u0443\u043a", 630, 15, 61, 17], ["\u0421\u0435\u043c\u0435\u0447\u043a\u0438", 580, 21, 53, 10],
  ["\u0410\u0440\u0430\u0445\u0438\u0441\u043e\u0432\u0430\u044f \u043f\u0430\u0441\u0442\u0430", 590, 25, 50, 20],
  ["\u0425\u043b\u0435\u0431 \u0431\u0435\u043b\u044b\u0439", 260, 8, 3, 49], ["\u0425\u043b\u0435\u0431 \u0447\u0451\u0440\u043d\u044b\u0439", 210, 6.6, 1.2, 41],
  ["\u0411\u0430\u0442\u043e\u043d", 264, 7.5, 2.9, 51], ["\u0425\u043b\u0435\u0431\u0446\u044b", 300, 10, 2, 60],
  ["\u041b\u0430\u0432\u0430\u0448", 275, 9, 1, 52], ["\u0411\u043b\u0438\u043d\u044b", 190, 6, 8, 26],
  ["\u041e\u043b\u0430\u0434\u044c\u0438", 210, 6, 9, 28], ["\u0421\u044b\u0440\u043d\u0438\u043a\u0438", 220, 17, 10, 18],
  ["\u041a\u0440\u0443\u0430\u0441\u0441\u0430\u043d", 400, 8, 21, 46], ["\u041f\u0435\u0447\u0435\u043d\u044c\u0435", 420, 7, 14, 68],
  ["\u041f\u0440\u044f\u043d\u0438\u043a", 350, 5, 3, 75], ["\u0411\u0443\u043b\u043e\u0447\u043a\u0430", 300, 8, 6, 55],
  ["\u0428\u043e\u043a\u043e\u043b\u0430\u0434 \u043c\u043e\u043b\u043e\u0447\u043d\u044b\u0439", 550, 7, 35, 52], ["\u0428\u043e\u043a\u043e\u043b\u0430\u0434 \u0442\u0451\u043c\u043d\u044b\u0439", 540, 6, 40, 48],
  ["\u041a\u043e\u043d\u0444\u0435\u0442\u044b", 450, 3, 20, 65], ["\u041c\u0451\u0434", 320, 0.3, 0, 80],
  ["\u0421\u0430\u0445\u0430\u0440", 400, 0, 0, 100], ["\u0412\u0430\u0440\u0435\u043d\u044c\u0435", 270, 0.4, 0, 70],
  ["\u0417\u0435\u0444\u0438\u0440", 320, 0.8, 0, 80], ["\u0425\u0430\u043b\u0432\u0430", 520, 12, 30, 54],
  ["\u0422\u043e\u0440\u0442", 400, 5, 20, 50], ["\u041f\u0438\u0440\u043e\u0436\u043d\u043e\u0435", 380, 5, 18, 50],
  ["\u041f\u0438\u0446\u0446\u0430", 260, 10, 10, 32], ["\u0411\u0443\u0440\u0433\u0435\u0440", 280, 15, 15, 25],
  ["\u0428\u0430\u0443\u0440\u043c\u0430", 230, 12, 13, 17], ["\u0425\u043e\u0442-\u0434\u043e\u0433", 260, 10, 15, 22],
  ["\u041d\u0430\u0433\u0433\u0435\u0442\u0441\u044b", 300, 15, 20, 16], ["\u0421\u0443\u0448\u0438 \u0440\u043e\u043b\u043b", 180, 6, 5, 28],
  ["\u0411\u043e\u0440\u0449", 50, 1.5, 2, 6], ["\u0421\u0443\u043f \u043a\u0443\u0440\u0438\u043d\u044b\u0439", 40, 2.5, 1.5, 4],
  ["\u041f\u043b\u043e\u0432", 200, 8, 8, 25], ["\u0421\u0430\u043b\u0430\u0442 \u043e\u043b\u0438\u0432\u044c\u0435", 200, 5, 15, 12],
  ["\u0421\u0430\u043b\u0430\u0442 \u0446\u0435\u0437\u0430\u0440\u044c", 190, 10, 14, 6], ["\u0412\u0438\u043d\u0435\u0433\u0440\u0435\u0442", 130, 1.5, 9, 10],
  ["\u041a\u043e\u0444\u0435 \u0441 \u043c\u043e\u043b\u043e\u043a\u043e\u043c", 40, 1.5, 1.5, 5], ["\u041a\u0430\u043f\u0443\u0447\u0438\u043d\u043e", 55, 2.5, 2.5, 6],
  ["\u041b\u0430\u0442\u0442\u0435", 60, 3, 3, 7], ["\u0421\u043e\u043a \u0430\u043f\u0435\u043b\u044c\u0441\u0438\u043d\u043e\u0432\u044b\u0439", 45, 0.7, 0.1, 10],
  ["\u041a\u043e\u043b\u0430", 42, 0, 0, 10.6], ["\u041a\u043e\u043c\u043f\u043e\u0442", 60, 0, 0, 15],
  ["\u041f\u0438\u0432\u043e", 43, 0.5, 0, 3.6], ["\u0412\u0438\u043d\u043e \u043a\u0440\u0430\u0441\u043d\u043e\u0435", 68, 0.2, 0, 0.3],
  ["\u041f\u0440\u043e\u0442\u0435\u0438\u043d. \u0431\u0430\u0442\u043e\u043d\u0447\u0438\u043a", 350, 30, 10, 35], ["\u041f\u0440\u043e\u0442\u0435\u0438\u043d \u043f\u043e\u0440\u043e\u0448\u043e\u043a", 380, 75, 7, 10],
  ["\u041c\u044e\u0441\u043b\u0438", 350, 10, 8, 60], ["\u0425\u043b\u043e\u043f\u044c\u044f \u0441 \u043c\u043e\u043b\u043e\u043a\u043e\u043c", 120, 4, 3, 20],
].map(([n, k, p, f, c]) => ({ n, k, p, f, c }));

const GRAM_PRESETS = [50, 100, 150, 200, 300];

const CSS = `
.kb-h { font-family:"Fredoka",sans-serif; font-weight:700; font-size:22px; margin:2px 4px 12px; color:var(--text); }
.kb-streak { display:flex; align-items:center; gap:13px; background:linear-gradient(135deg,var(--card),var(--card2));
  border:1px solid var(--line); border-radius:18px; padding:14px 16px; margin-bottom:14px; box-shadow:0 4px 14px var(--shadow); }
.kb-fire { font-size:34px; line-height:1; filter:drop-shadow(0 0 10px var(--accentsoft)); }
.kb-fire.off { filter:grayscale(1) opacity(.55); }
.kb-streak-mid { flex:1; min-width:0; }
.kb-streak-num { font-family:"Fredoka",sans-serif; font-weight:700; font-size:19px; color:var(--text); line-height:1.1; }
.kb-streak-num b { color:var(--accent); font-size:23px; }
.kb-streak-sub { font-size:12.5px; color:var(--muted); margin-top:2px; }
.kb-card { background:var(--card); border:1px solid var(--line); border-radius:20px; padding:14px; box-shadow:0 4px 14px var(--shadow); margin-bottom:14px; }
.kb-ct { font-family:"Fredoka",sans-serif; font-weight:600; font-size:16px; margin:0 0 10px; color:var(--text); }

.kb-srow { display:flex; gap:8px; position:relative; }
.kb-srow input { flex:1; min-width:0; border:1px solid var(--line); background:var(--inp); color:var(--text);
  border-radius:14px; padding:13px 14px; font-size:15px; outline:none; }
.kb-mic { flex:none; width:48px; border:0; border-radius:14px; background:var(--accentsoft); color:var(--accent); font-size:19px; cursor:pointer; }
.kb-mic.rec { background:var(--accent); color:#fff; animation:kbpulse 1s infinite; }
@keyframes kbpulse { 0%,100%{opacity:1} 50%{opacity:.55} }

.kb-drop { margin-top:8px; border:1px solid var(--line); border-radius:14px; overflow:hidden; background:var(--inp); }
.kb-opt { display:flex; justify-content:space-between; align-items:center; padding:11px 13px; cursor:pointer; border-bottom:1px solid var(--line); }
.kb-opt:last-child { border-bottom:0; }
.kb-opt:active { background:var(--accentsoft); }
.kb-opt .nm { font-weight:700; font-size:14px; color:var(--text); }
.kb-opt .kc { font-size:12px; color:var(--muted); white-space:nowrap; }
.kb-none { padding:12px 13px; color:var(--muted); font-size:13px; }

.kb-sel-nm { font-family:"Fredoka",sans-serif; font-weight:600; font-size:17px; color:var(--text); margin-bottom:10px; }
.kb-glabel { font-size:13px; color:var(--muted); font-weight:700; margin-bottom:6px; }
.kb-grow { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
.kb-grow input { width:100px; border:1px solid var(--line); background:var(--inp); color:var(--text);
  border-radius:12px; padding:11px 12px; font-size:17px; font-weight:800; font-family:"Fredoka",sans-serif; outline:none; text-align:center; }
.kb-grow .unit { color:var(--muted); font-weight:700; }
.kb-gchips { display:flex; gap:7px; flex-wrap:wrap; margin-bottom:12px; }
.kb-gchip { border:1px solid var(--line); background:var(--inp); color:var(--text); border-radius:999px; padding:7px 12px; font-size:13px; font-weight:700; cursor:pointer; }
.kb-gchip.sel { border-color:var(--accent); background:var(--accentsoft); color:var(--accent); }

.kb-prev { display:flex; align-items:stretch; gap:8px; background:var(--inp); border-radius:14px; padding:12px; margin-bottom:12px; }
.kb-prev .cal { flex:none; text-align:center; padding-right:12px; border-right:1px solid var(--line); display:flex; flex-direction:column; justify-content:center; }
.kb-prev .cal b { font-family:"Fredoka",sans-serif; font-size:26px; color:var(--accent); line-height:1; }
.kb-prev .cal span { font-size:11px; color:var(--muted); font-weight:700; }
.kb-prev .macros { flex:1; display:flex; justify-content:space-around; align-items:center; }
.kb-mac { text-align:center; }
.kb-mac b { display:block; font-size:16px; font-weight:800; color:var(--text); }
.kb-mac span { font-size:11px; color:var(--muted); font-weight:700; }

.kb-add { width:100%; border:0; border-radius:15px; padding:14px; font-size:16px; font-weight:800; color:#fff;
  cursor:pointer; font-family:"Fredoka",sans-serif; background:linear-gradient(135deg,var(--accent),var(--accent2)); }
.kb-add:disabled { opacity:.45; }
.kb-link { display:block; width:100%; text-align:center; background:transparent; border:0; color:var(--muted);
  font-size:13px; font-weight:700; margin-top:10px; cursor:pointer; }

.kb-man input { width:100%; border:1px solid var(--line); background:var(--inp); color:var(--text);
  border-radius:12px; padding:11px 13px; font-size:14px; outline:none; margin-bottom:8px; }

.kb-list { display:flex; flex-direction:column; gap:9px; }
.kb-item { display:flex; align-items:center; gap:11px; background:var(--card); border:1px solid var(--line); border-radius:16px; padding:11px 12px; }
.kb-icn { width:40px; height:40px; flex:none; border-radius:12px; background:var(--accentsoft); display:flex; align-items:center; justify-content:center; font-size:19px; }
.kb-imid { flex:1; min-width:0; }
.kb-inm { font-weight:800; font-size:14px; color:var(--text); }
.kb-imac { font-size:12px; color:var(--dim); margin-top:1px; }
.kb-ikc { font-family:"Fredoka",sans-serif; font-weight:700; font-size:15px; color:var(--accent); white-space:nowrap; }
.kb-del { flex:none; border:0; background:transparent; color:var(--dim); font-size:18px; cursor:pointer; padding:2px 4px; }
.kb-empty { text-align:center; color:var(--muted); padding:22px 10px; font-size:14px; }
.kb-normhead { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.kb-normhead b { font-family:"Fredoka",sans-serif; font-weight:600; font-size:16px; }
.kb-normhead button { border:0; background:var(--inp); color:var(--muted); font-size:12px; font-weight:700; padding:6px 10px; border-radius:9px; cursor:pointer; }
`;

export default function KBJU() {
  const [data, setData] = useState({ meals: [], totals: { calories: 0, protein: 0, fat: 0, carbs: 0 }, streak: { count: 0, loggedToday: false } });
  const [profileData, setProfileData] = useState({ profile: null, targets: null });
  const [editingProfile, setEditingProfile] = useState(false);

  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [grams, setGrams] = useState("100");
  const [manual, setManual] = useState(false);
  const [mform, setMform] = useState({ name: "", calories: "", protein: "", fat: "", carbs: "" });

  const { listening, start, stop } = useVoiceInput((text) => setQ(text));
  const supported =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  const toggle = () => (listening ? stop() : start());

  const loadMeals = () => api.get("/api/meals").then(setData).catch(console.error);
  const loadProfile = () => api.get("/api/profile").then(setProfileData).catch(console.error);
  useEffect(() => { loadMeals(); loadProfile(); }, []);

  const matches =
    q.trim().length >= 1 && !sel
      ? FOOD.filter((f) => f.n.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
      : [];

  const g = Number(grams) || 0;
  const factor = g / 100;
  const prev = sel
    ? {
        kcal: Math.round(sel.k * factor),
        p: +(sel.p * factor).toFixed(1),
        f: +(sel.f * factor).toFixed(1),
        c: +(sel.c * factor).toFixed(1),
      }
    : null;

  const pick = (f) => { setSel(f); setQ(f.n); setGrams("100"); };
  const reset = () => { setSel(null); setQ(""); setGrams("100"); };

  const addFromDb = async () => {
    if (!sel || !g) return;
    await api.post("/api/meals", {
      name: sel.n + " (" + g + " \u0433)",
      calories: prev.kcal, protein: prev.p, fat: prev.f, carbs: prev.c,
    });
    reset();
    loadMeals();
  };

  const addManual = async () => {
    if (!mform.name) return;
    await api.post("/api/meals", {
      name: mform.name,
      calories: Number(mform.calories) || 0,
      protein: Number(mform.protein) || 0,
      fat: Number(mform.fat) || 0,
      carbs: Number(mform.carbs) || 0,
    });
    setMform({ name: "", calories: "", protein: "", fat: "", carbs: "" });
    setManual(false);
    loadMeals();
  };

  const del = async (id) => { await api.del("/api/meals/" + id); loadMeals(); };
  const onProfileSaved = (res) => { setProfileData(res); setEditingProfile(false); };
  const targets = profileData.targets;

  return (
    <div>
      <style>{CSS}</style>
      <div className="kb-h">{S.title}</div>

      {(() => {
        const st = data.streak || { count: 0, loggedToday: false };
        const n = st.count || 0;
        const numText =
          n > 0 ? [<b key="b">{n}</b>, " " + pluralDay(n) + " " + S.suffix] : S.streakStart;
        const sub = n === 0 ? S.sub0 : st.loggedToday ? S.subKeep : S.subToday;
        return (
          <div className="kb-streak">
            <div className={"kb-fire" + (n === 0 ? " off" : "")}>{S.fire}</div>
            <div className="kb-streak-mid">
              <div className="kb-streak-num">{numText}</div>
              <div className="kb-streak-sub">{sub}</div>
            </div>
          </div>
        );
      })()}

      {(!profileData.profile || editingProfile) && (
        <ProfileForm initial={profileData.profile} onSaved={onProfileSaved} />
      )}

      {targets && !editingProfile && (
        <div className="kb-card">
          <div className="kb-normhead">
            <b>{S.norm}</b>
            <button onClick={() => setEditingProfile(true)}>{S.edit}</button>
          </div>
          <ProgressBar label={S.calories} current={data.totals.calories} target={targets.calories} unit={S.kcal} />
          <ProgressBar label={S.protein} current={data.totals.protein} target={targets.protein} unit={S.g} />
          <ProgressBar label={S.fat} current={data.totals.fat} target={targets.fat} unit={S.g} />
          <ProgressBar label={S.carbs} current={data.totals.carbs} target={targets.carbs} unit={S.g} />
        </div>
      )}

      <div className="kb-card">
        <div className="kb-ct">{S.addMeal}</div>

        {!manual && (
          <>
            <div className="kb-srow">
              <input
                placeholder={S.searchPh}
                value={q}
                onChange={(e) => { setQ(e.target.value); setSel(null); }}
              />
              {supported && (
                <button className={"kb-mic" + (listening ? " rec" : "")} onClick={toggle}>{S.mic}</button>
              )}
            </div>

            {matches.length > 0 && (
              <div className="kb-drop">
                {matches.map((f) => (
                  <div className="kb-opt" key={f.n} onClick={() => pick(f)}>
                    <span className="nm">{f.n}</span>
                    <span className="kc">{f.k} {S.per100}</span>
                  </div>
                ))}
              </div>
            )}
            {q.trim().length >= 1 && !sel && matches.length === 0 && (
              <div className="kb-drop"><div className="kb-none">{S.nothing}</div></div>
            )}

            {sel && (
              <div style={{ marginTop: 12 }}>
                <div className="kb-sel-nm">{sel.n}</div>
                <div className="kb-glabel">{S.gram}</div>
                <div className="kb-grow">
                  <input type="number" inputMode="numeric" value={grams}
                    onChange={(e) => setGrams(e.target.value)} />
                  <span className="unit">{S.g}</span>
                </div>
                <div className="kb-gchips">
                  {GRAM_PRESETS.map((gp) => (
                    <button key={gp} className={"kb-gchip" + (String(gp) === String(grams) ? " sel" : "")}
                      onClick={() => setGrams(String(gp))}>{gp} {S.g}</button>
                  ))}
                </div>
                <div className="kb-prev">
                  <div className="cal"><b>{prev.kcal}</b><span>{S.kcal}</span></div>
                  <div className="macros">
                    <div className="kb-mac"><b>{prev.p}</b><span>{S.pL}</span></div>
                    <div className="kb-mac"><b>{prev.f}</b><span>{S.fL}</span></div>
                    <div className="kb-mac"><b>{prev.c}</b><span>{S.cL}</span></div>
                  </div>
                </div>
                <button className="kb-add" onClick={addFromDb} disabled={!g}>{S.add}</button>
              </div>
            )}

            <button className="kb-link" onClick={() => setManual(true)}>{S.manual}</button>
          </>
        )}

        {manual && (
          <div className="kb-man">
            <input placeholder={S.namePh} value={mform.name}
              onChange={(e) => setMform({ ...mform, name: e.target.value })} />
            <input placeholder={S.kcalPh} type="number" value={mform.calories}
              onChange={(e) => setMform({ ...mform, calories: e.target.value })} />
            <input placeholder={S.pPh} type="number" value={mform.protein}
              onChange={(e) => setMform({ ...mform, protein: e.target.value })} />
            <input placeholder={S.fPh} type="number" value={mform.fat}
              onChange={(e) => setMform({ ...mform, fat: e.target.value })} />
            <input placeholder={S.cPh} type="number" value={mform.carbs}
              onChange={(e) => setMform({ ...mform, carbs: e.target.value })} />
            <button className="kb-add" onClick={addManual}>{S.add}</button>
            <button className="kb-link" onClick={() => setManual(false)}>{S.back}</button>
          </div>
        )}
      </div>

      <div className="kb-list">
        {data.meals.length === 0 && <div className="kb-empty">{S.empty}</div>}
        {data.meals.map((m) => (
          <div className="kb-item" key={m.id}>
            <div className="kb-icn">{S.plate}</div>
            <div className="kb-imid">
              <div className="kb-inm">{m.name}</div>
              <div className="kb-imac">{S.pS} {m.protein}{S.dot}{S.fS} {m.fat}{S.dot}{S.cS} {m.carbs}</div>
            </div>
            <div className="kb-ikc">{m.calories} {S.kcal}</div>
            <button className="kb-del" onClick={() => del(m.id)}>{S.del}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
