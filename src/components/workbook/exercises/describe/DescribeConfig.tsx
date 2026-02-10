"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import AIExercisePanel from "../../shared/AIExercisePanel";
import {
  TreePalm,
  Buildings,
  Users,
  Coffee,
  Sun,
  Mountains,
  ShoppingBag,
  BookOpen
} from "@phosphor-icons/react";

interface DescribeConfigProps {
  onStartPractice: (config: {
    prompt: string;
    level: "A1" | "A2" | "B1" | "B2";
    category?: string;
  }) => void;
}

type Category = {
  id: string;
  label: string;
  icon: typeof TreePalm;
  examples: string[];
};

export default function DescribeConfig({ onStartPractice }: DescribeConfigProps) {
  const { t } = useLocale();
  const [prompt, setPrompt] = useState("");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A1");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories: Category[] = [
    {
      id: "nature",
      label: "Природа",
      icon: TreePalm,
      examples: ["park", "forest", "mountains", "beach", "lake", "sunset"]
    },
    {
      id: "city",
      label: "Місто",
      icon: Buildings,
      examples: ["street", "building", "cafe", "market", "square", "architecture"]
    },
    {
      id: "people",
      label: "Люди",
      icon: Users,
      examples: ["family", "friends", "portrait", "children", "group"]
    },
    {
      id: "food",
      label: "Їжа та напої",
      icon: Coffee,
      examples: ["breakfast", "coffee", "restaurant", "meal", "kitchen"]
    },
    {
      id: "travel",
      label: "Подорожі",
      icon: Mountains,
      examples: ["vacation", "adventure", "tourism", "landscape", "destination"]
    },
    {
      id: "lifestyle",
      label: "Повсякденність",
      icon: ShoppingBag,
      examples: ["shopping", "home", "interior", "fashion", "workspace"]
    },
    {
      id: "education",
      label: "Навчання",
      icon: BookOpen,
      examples: ["classroom", "library", "study", "school", "books"]
    },
    {
      id: "seasons",
      label: "Пори року",
      icon: Sun,
      examples: ["spring", "summer", "autumn", "winter", "snow", "flowers"]
    }
  ];

  const handleCategorySelect = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setSelectedCategory(categoryId);
      // Set a random example as prompt
      const randomExample = category.examples[Math.floor(Math.random() * category.examples.length)];
      setPrompt(`Describe a scene with ${randomExample}`);
    }
  };

  const handleStart = () => {
    if (!prompt.trim()) return;
    onStartPractice({
      prompt: prompt.trim(),
      level,
      category: selectedCategory || undefined
    });
  };

  return (
    <div className="space-y-6">
      <AIExercisePanel
        exercise="describe"
        onUsePrompt={(text) => setPrompt(text)}
      />

      <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
        <h3 className="text-xl font-semibold">{t.workbook.describeConfigTitle || "Налаштування опису зображення"}</h3>
        <p className="mt-2 text-sm text-ink/60">{t.workbook.describeConfigHint || "Оберіть категорію або введіть власний опис"}</p>

        {/* Category Selection */}
        <div className="mt-6">
          <label className="block text-xs uppercase tracking-[0.2em] text-ink/40">
            Категорія зображення (опціонально)
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategorySelect(category.id)}
                  className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    isSelected
                      ? "border-moss bg-moss/10"
                      : "border-ink/10 bg-paper hover:border-ink/20 hover:bg-ink/5"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                    isSelected ? "bg-moss/20" : "bg-ink/5 group-hover:bg-ink/10"
                  }`}>
                    <Icon size={20} weight="bold" className={isSelected ? "text-moss" : "text-ink/60"} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isSelected ? "text-moss" : "text-ink"}`}>
                      {category.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Prompt */}
        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_220px]">
          <label className="block text-sm text-ink/70">
            {t.workbook.describePrompt || "Опис сцени"}
            <input
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                setSelectedCategory(null); // Clear category on manual input
              }}
              className="mt-2 w-full rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm focus:border-moss/40 focus:outline-none"
              placeholder={t.workbook.describePromptPlaceholder || "Наприклад: A busy street in Krakow"}
            />
          </label>

          <label className="block text-sm text-ink/70">
            {t.workbook.describeLevel || "Рівень"}
            <div className="mt-2 grid grid-cols-4 gap-2">
              {(["A1", "A2", "B1", "B2"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    level === lvl
                      ? "border-moss bg-moss text-paper"
                      : "border-ink/10 bg-paper hover:border-ink/20"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </label>
        </div>

        <button
          onClick={handleStart}
          disabled={!prompt.trim()}
          className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:opacity-50"
        >
          {t.workbook.startPractice || "Почати практику"}
        </button>
      </div>
    </div>
  );
}
