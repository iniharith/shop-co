/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useFilterStore } from "@/store/filterStore";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function FilterSidebar() {
  const { locale, t } = useLanguage();
  const {
    serviceCategories,
    turnarounds,
    formats,
    materials,
    priceRange,
    setServiceCategories,
    setTurnarounds,
    setFormats,
    setMaterials,
    setPriceRange,
    resetFilters,
  } = useFilterStore();

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  const toggleArrayItem = (item: string, array: string[], setFunction: (arr: string[]) => void) => {
    const newArray = [...array];
    if (newArray.includes(item)) {
      newArray.splice(newArray.indexOf(item), 1);
    } else {
      newArray.push(item);
    }
    setFunction(newArray);
  };

  const categoryList = [
    "Digital Printing", "Display Item", "Digital Offset",
    "Premium Gift", "Apparel", "Wedding Product", "Food Packaging", "Islamic Khat"
  ];
  const turnaroundList = ["Standard (3-4 Days)", "Express (1-2 Days)"];
  const formatList = ["A4", "A5", "A3", "Custom Size", "Large Format"];
  const materialList = ["Art Paper", "Art Card", "Glossy Photo Paper", "Matte Premium Paper", "Canvas", "Tarpaulin"];
  const malayLabels: Record<string, string> = {
    "Digital Printing": "Cetakan Digital",
    "Display Item": "Item Pameran",
    "Digital Offset": "Offset Digital",
    "Premium Gift": "Hadiah Premium",
    Apparel: "Pakaian",
    "Wedding Product": "Produk Perkahwinan",
    "Food Packaging": "Pembungkusan Makanan",
    "Islamic Khat": "Khat Islamik",
    "Standard (3-4 Days)": "Standard (3-4 Hari)",
    "Express (1-2 Days)": "Ekspres (1-2 Hari)",
    "Custom Size": "Saiz Tersuai",
    "Large Format": "Format Besar",
    "Art Paper": "Kertas Art",
    "Art Card": "Kad Art",
    "Glossy Photo Paper": "Kertas Foto Berkilat",
    "Matte Premium Paper": "Kertas Premium Matte",
    Tarpaulin: "Kanvas Tarpaulin",
  };
  const displayLabel = (label: string) => locale === "ms" ? malayLabels[label] || label : label;

  return (
    <div className="w-full md:max-w-[300px] p-4 md:border-input border-transparent border md:mt-5 rounded-lg bg-white dark:bg-card shadow-sm">
      <div className="flex items-center border-b border-border pb-3 justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">{t("filters.title")}</h2>
        <button type="button" onClick={resetFilters} className="rounded text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          {t("filters.clear")}
        </button>
      </div>

      <Accordion className="w-full" type="multiple" defaultValue={["categories", "price", "turnaround"]}>
        
        {/* Service Categories */}
        <AccordionItem value="categories" className="border-b border-gray-100 dark:border-border">
          <AccordionTrigger className="hover:no-underline">
            <h3 className="text-sm font-bold text-foreground">{t("filters.category")}</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3 pt-2 pb-4">
              {categoryList.map((category) => (
                <label key={category} className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox
                    checked={serviceCategories.includes(category)}
                    onCheckedChange={() => toggleArrayItem(category, serviceCategories, setServiceCategories)}
                    className="h-4 w-4 rounded border-gray-300 text-primary data-[state=checked]:bg-primary"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">{displayLabel(category)}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Turnaround Time */}
        <AccordionItem value="turnaround" className="border-b border-gray-100 dark:border-border">
          <AccordionTrigger className="hover:no-underline">
            <h3 className="text-sm font-bold text-foreground">{t("filters.turnaround")}</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3 pt-2 pb-4">
              {turnaroundList.map((time) => (
                <label key={time} className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox
                    checked={turnarounds.includes(time)}
                    onCheckedChange={() => toggleArrayItem(time, turnarounds, setTurnarounds)}
                    className="h-4 w-4 rounded border-gray-300 text-primary data-[state=checked]:bg-primary"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">{displayLabel(time)}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price" className="border-b border-gray-100 dark:border-border">
          <AccordionTrigger className="hover:no-underline">
            <h3 className="text-sm font-bold text-foreground">{t("filters.price")}</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-4 pb-6 px-2">
              <Slider
                defaultValue={[0, 1000]}
                value={priceRange}
                max={1000}
                min={0}
                step={10}
                onValueChange={handlePriceChange}
                thumbLabels={locale === "ms" ? ["Harga minimum", "Harga maksimum"] : ["Minimum price", "Maximum price"]}
                className="my-4 [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
              />
              <div className="flex justify-between items-center mt-4">
                <div className="bg-gray-100 dark:bg-muted px-3 py-1 rounded-md text-xs font-semibold">RM {priceRange[0]}</div>
                <div className="bg-gray-100 dark:bg-muted px-3 py-1 rounded-md text-xs font-semibold">RM {priceRange[1]}</div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Format / Size */}
        <AccordionItem value="format" className="border-b border-gray-100 dark:border-border">
          <AccordionTrigger className="hover:no-underline">
            <h3 className="text-sm font-bold text-foreground">{t("filters.format")}</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2 pt-2 pb-4">
              {formatList.map((format) => (
                <button
                  type="button"
                  key={format}
                  onClick={() => toggleArrayItem(format, formats, setFormats)}
                  aria-pressed={formats.includes(format)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    formats.includes(format)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary hover:text-primary"
                  )}
                >
                  {displayLabel(format)}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Material */}
        <AccordionItem value="material" className="border-b-0">
          <AccordionTrigger className="hover:no-underline">
            <h3 className="text-sm font-bold text-foreground">{t("filters.material")}</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3 pt-2 pb-2">
              {materialList.map((mat) => (
                <label key={mat} className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox
                    checked={materials.includes(mat)}
                    onCheckedChange={() => toggleArrayItem(mat, materials, setMaterials)}
                    className="h-4 w-4 rounded border-gray-300 text-primary data-[state=checked]:bg-primary"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">{displayLabel(mat)}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>

      {/* Apply Button */}
      <Button
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-6 mt-6 font-bold text-sm shadow-md"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        {t("filters.apply")}
      </Button>
    </div>
  );
}
