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

export default function FilterSidebar() {
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

  return (
    <div className="w-full md:max-w-[300px] p-4 md:border-input border-transparent border md:mt-5 rounded-lg bg-white dark:bg-card shadow-sm">
      <div className="flex items-center border-b border-border pb-3 justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-foreground">Filters</h2>
        <button onClick={resetFilters} className="text-xs font-semibold text-primary hover:underline">
          Clear All
        </button>
      </div>

      <Accordion className="w-full" type="multiple" defaultValue={["categories", "price", "turnaround"]}>
        
        {/* Service Categories */}
        <AccordionItem value="categories" className="border-b border-gray-100 dark:border-border">
          <AccordionTrigger className="hover:no-underline">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Service Category</h3>
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
                  <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">{category}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Turnaround Time */}
        <AccordionItem value="turnaround" className="border-b border-gray-100 dark:border-border">
          <AccordionTrigger className="hover:no-underline">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Turnaround Time</h3>
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
                  <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">{time}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price" className="border-b border-gray-100 dark:border-border">
          <AccordionTrigger className="hover:no-underline">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Price Range</h3>
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
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Format & Size</h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2 pt-2 pb-4">
              {formatList.map((format) => (
                <button
                  key={format}
                  onClick={() => toggleArrayItem(format, formats, setFormats)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
                    formats.includes(format)
                      ? "bg-primary text-white border-primary"
                      : "bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary hover:text-primary"
                  )}
                >
                  {format}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Material */}
        <AccordionItem value="material" className="border-b-0">
          <AccordionTrigger className="hover:no-underline">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Material</h3>
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
                  <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">{mat}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>

      {/* Apply Button */}
      <Button
        className="w-full bg-primary text-white hover:bg-primary/90 rounded-xl py-6 mt-6 font-bold text-sm shadow-md"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        Apply Filters
      </Button>
    </div>
  );
}
