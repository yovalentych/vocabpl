"use client";

import { useState } from "react";
import TeacherPlanCard from "./TeacherPlanCard";
import { teacherPlans } from "@/lib/plans";
import type { TeacherPlanId, TeacherExperience } from "@/lib/teacher-types";
import { csrfFetch } from "@/lib/csrf-client";

type WizardStep = "intro" | "plans" | "profile" | "payment" | "verification" | "success";

type TeacherRegistrationWizardProps = {
  locale: "pl" | "uk";
  onComplete?: () => void;
};

export default function TeacherRegistrationWizard({
  locale,
  onComplete,
}: TeacherRegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("intro");
  const [selectedPlanId, setSelectedPlanId] = useState<TeacherPlanId>("teacher_pro_m");
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    schoolOrInstitution: "",
    teachingExperience: "" as TeacherExperience | "",
    motivation: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = {
    pl: {
      stepIntro: "Wprowadzenie",
      stepPlans: "Plany",
      stepProfile: "Profil",
      stepPayment: "Płatność",
      stepVerification: "Weryfikacja",
      stepSuccess: "Gotowe",
      next: "Dalej",
      back: "Wstecz",
      submit: "Wysłać",
      benefits: "Dlaczego warto zostać nauczycielem?",
      benefit1: "📚 Twórz klasy i zadania online",
      benefit2: "🤖 Automatyczna ocena z AI",
      benefit3: "📊 Śledź postępy uczniów",
      benefit4: "💡 Dostęp do kompletnego kompendium gramatyki",
      getStarted: "Zaczynaj!",
      choosePlan: "Wybierz swój plan",
      planDescription: "Wszystkie plany zawierają pełny dostęp do narzędzi nauczycielskich.",
      fullName: "Imię i nazwisko *",
      phoneNumber: "Numer telefonu (opcjonalnie)",
      school: "Szkoła/Instytucja (opcjonalnie)",
      experience: "Doświadczenie nauczania",
      motivation: "Czemu chcesz uczyć? (opcjonalnie)",
      exp01: "0-1 lat",
      exp13: "1-3 lata",
      exp35: "3-5 lat",
      exp5plus: "5+ lat",
      register: "Zarejestruj się",
      verificationTitle: "Sprawdź swój email",
      verificationDesc: "Wysłaliśmy 6-cyfrowy kod na twój email. Wprowadź go poniżej:",
      verificationCode: "Kod weryfikacyjny",
      verify: "Weryfikuj",
      resendCode: "Wyślij kod ponownie",
      paymentTitle: "Płatność",
      paymentDesc: "Zostaniesz przekierowany do Monobank aby dokonać bezpiecznej płatności.",
      autoRenew: "Automatyczne odnowienie (zapisz kartę)",
      proceedToPayment: "Przejdź do płatności",
      successTitle: "Witamy w zespole!",
      successDesc:
        "Twoja rejestracja została zakończona pomyślnie. Możesz teraz tworzyć klasy i zadania.",
      goToCabinet: "Przejdź do Kabinietu",
      requiredFields: "Wypełnij wszystkie wymagane pola",
      invalidCode: "Nieprawidłowy kod",
      loading: "Ładowanie...",
    },
    uk: {
      stepIntro: "Введення",
      stepPlans: "Плани",
      stepProfile: "Профіль",
      stepPayment: "Оплата",
      stepVerification: "Верифікація",
      stepSuccess: "Готово",
      next: "Далі",
      back: "Назад",
      submit: "Надіслати",
      benefits: "Чому варто стати вчителем?",
      benefit1: "📚 Створюйте класи та завдання онлайн",
      benefit2: "🤖 Автоматична перевірка з AI",
      benefit3: "📊 Відстежуйте прогрес студентів",
      benefit4: "💡 Доступ до повного компендіуму граматики",
      getStarted: "Почати!",
      choosePlan: "Оберіть ваш план",
      planDescription: "Всі плани включають повний доступ до інструментів вчителя.",
      fullName: "Ім'я та прізвище *",
      phoneNumber: "Номер телефону (необов'язково)",
      school: "Школа/Установа (необов'язково)",
      experience: "Досвід викладання",
      motivation: "Чому хочете викладати? (необов'язково)",
      exp01: "0-1 років",
      exp13: "1-3 роки",
      exp35: "3-5 років",
      exp5plus: "5+ років",
      register: "Зареєструватися",
      verificationTitle: "Перевірте ваш email",
      verificationDesc: "Ми надіслали 6-значний код на ваш email. Введіть його нижче:",
      verificationCode: "Код верифікації",
      verify: "Верифікувати",
      resendCode: "Надіслати код знову",
      paymentTitle: "Оплата",
      paymentDesc: "Вас буде перенаправлено до Monobank для безпечної оплати.",
      autoRenew: "Автоматичне поновлення (зберегти картку)",
      proceedToPayment: "Перейти до оплати",
      successTitle: "Ласкаво просимо в команду!",
      successDesc:
        "Вашу реєстрацію успішно завершено. Тепер ви можете створювати класи та завдання.",
      goToCabinet: "Перейти до Кабінету",
      requiredFields: "Заповніть всі обов'язкові поля",
      invalidCode: "Невірний код",
      loading: "Завантаження...",
    },
  };

  const text = t[locale];

  const steps: WizardStep[] = ["intro", "plans", "profile", "verification", "payment", "success"];
  const stepLabels: Record<WizardStep, string> = {
    intro: text.stepIntro,
    plans: text.stepPlans,
    profile: text.stepProfile,
    payment: text.stepPayment,
    verification: text.stepVerification,
    success: text.stepSuccess,
  };

  const handleNext = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleRegister = async () => {
    if (!formData.fullName.trim()) {
      setError(text.requiredFields);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await csrfFetch("/api/teacher/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          planId: selectedPlanId,
          phoneNumber: formData.phoneNumber || undefined,
          schoolOrInstitution: formData.schoolOrInstitution || undefined,
          teachingExperience: formData.teachingExperience || undefined,
          motivation: formData.motivation || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      handleNext(); // Move to verification
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError(text.invalidCode);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await csrfFetch("/api/teacher/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      handleNext(); // Move to payment
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await csrfFetch("/api/teacher/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoRenew }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment creation failed");
      }

      if (data.pageUrl) {
        window.location.href = data.pageUrl;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-between">
        {steps.slice(0, -1).map((step, index) => (
          <div key={step} className="flex flex-1 items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                steps.indexOf(currentStep) >= index
                  ? "bg-amber-600 text-white"
                  : "bg-stone-200 text-stone-600"
              }`}
            >
              {index + 1}
            </div>
            {index < steps.length - 2 && (
              <div
                className={`mx-2 h-1 flex-1 ${
                  steps.indexOf(currentStep) > index ? "bg-amber-600" : "bg-stone-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {currentStep === "intro" && (
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-stone-900">{text.benefits}</h2>
            <div className="mb-8 space-y-3 text-left">
              <p className="text-lg text-stone-700">{text.benefit1}</p>
              <p className="text-lg text-stone-700">{text.benefit2}</p>
              <p className="text-lg text-stone-700">{text.benefit3}</p>
              <p className="text-lg text-stone-700">{text.benefit4}</p>
            </div>
            <button
              onClick={handleNext}
              className="rounded-xl bg-amber-600 px-8 py-3 text-lg font-semibold text-white hover:bg-amber-700"
            >
              {text.getStarted}
            </button>
          </div>
        )}

        {currentStep === "plans" && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-stone-900">{text.choosePlan}</h2>
            <p className="mb-6 text-stone-600">{text.planDescription}</p>
            <div className="grid gap-4 md:grid-cols-3">
              {teacherPlans.map((plan) => (
                <TeacherPlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlanId === plan.id}
                  recommended={plan.id === "teacher_pro_m"}
                  onSelect={() => setSelectedPlanId(plan.id as TeacherPlanId)}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        )}

        {currentStep === "profile" && (
          <div>
            <h2 className="mb-6 text-2xl font-bold text-stone-900">{text.stepProfile}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  {text.fullName}
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  {text.phoneNumber}
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-4 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  {text.school}
                </label>
                <input
                  type="text"
                  value={formData.schoolOrInstitution}
                  onChange={(e) =>
                    setFormData({ ...formData, schoolOrInstitution: e.target.value })
                  }
                  className="w-full rounded-lg border border-stone-300 px-4 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  {text.experience}
                </label>
                <select
                  value={formData.teachingExperience}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      teachingExperience: e.target.value as TeacherExperience,
                    })
                  }
                  className="w-full rounded-lg border border-stone-300 px-4 py-2"
                >
                  <option value="">—</option>
                  <option value="0-1">{text.exp01}</option>
                  <option value="1-3">{text.exp13}</option>
                  <option value="3-5">{text.exp35}</option>
                  <option value="5+">{text.exp5plus}</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  {text.motivation}
                </label>
                <textarea
                  value={formData.motivation}
                  onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-4 py-2"
                  rows={4}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </div>
        )}

        {currentStep === "verification" && (
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-stone-900">{text.verificationTitle}</h2>
            <p className="mb-6 text-stone-600">{text.verificationDesc}</p>
            <div className="mx-auto max-w-sm">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="mb-4 w-full rounded-lg border border-stone-300 px-4 py-3 text-center text-2xl tracking-widest"
                maxLength={6}
              />
              {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
              <button
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
                className="w-full rounded-xl bg-amber-600 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? text.loading : text.verify}
              </button>
            </div>
          </div>
        )}

        {currentStep === "payment" && (
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-stone-900">{text.paymentTitle}</h2>
            <p className="mb-6 text-stone-600">{text.paymentDesc}</p>
            <div className="mx-auto max-w-sm">
              <label className="mb-4 flex items-center justify-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-stone-700">{text.autoRenew}</span>
              </label>
              {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full rounded-xl bg-amber-600 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? text.loading : text.proceedToPayment}
              </button>
            </div>
          </div>
        )}

        {currentStep === "success" && (
          <div className="text-center">
            <div className="mb-4 text-6xl">🎉</div>
            <h2 className="mb-2 text-3xl font-bold text-stone-900">{text.successTitle}</h2>
            <p className="mb-6 text-stone-600">{text.successDesc}</p>
            <a
              href="/cabinet"
              className="inline-block rounded-xl bg-amber-600 px-8 py-3 font-semibold text-white hover:bg-amber-700"
            >
              {text.goToCabinet}
            </a>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep !== "intro" && currentStep !== "success" && (
          <div className="mt-8 flex justify-between">
            <button
              onClick={handleBack}
              disabled={loading}
              className="rounded-lg border border-stone-300 px-6 py-2 font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            >
              {text.back}
            </button>
            {currentStep === "plans" && (
              <button
                onClick={handleNext}
                className="rounded-lg bg-stone-900 px-6 py-2 font-semibold text-white hover:bg-stone-800"
              >
                {text.next}
              </button>
            )}
            {currentStep === "profile" && (
              <button
                onClick={handleRegister}
                disabled={loading}
                className="rounded-lg bg-amber-600 px-6 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? text.loading : text.register}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
