/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useOrder } from "@/hooks/useOrder";
import React, { RefObject } from "react";
import { FormField } from "../ui/form";
import { Form } from "../ui/form";
import FormGeneratorV2 from "../global/formgenrator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recentAddresses } from "@/constants/data";
import { FaAddressCard } from "react-icons/fa";
import { FaMapLocationDot } from "react-icons/fa6";
import { LuMapPinHouse } from "react-icons/lu";
import { IoEarthSharp } from "react-icons/io5";
import { FaFlag, FaUser, FaStickyNote } from "react-icons/fa";
import { useIsMobile } from "@/hooks/use-mobile";
import { Switch } from "@/components/ui/switch";
import {
  Drawer,
  DrawerTitle,
  DrawerContent,
  DrawerTrigger,
} from "../ui/drawer";
import { ScrollArea } from "../ui/scroll-area";
import { CgOptions } from "react-icons/cg";
import { Button } from "@heroui/button";
import { Control, FieldErrors, UseFormReturn } from "react-hook-form";

const AddressForm = ({
  form,
  onFormSubmit,
  control,
  errors,
  formRef,
}: {
  form: UseFormReturn<any>;
  onFormSubmit: (data: any) => void;
  control: Control<any>;
  errors: FieldErrors<any>;
  formRef: RefObject<HTMLFormElement>;
}) => {
  const { previousAddressData, previousAddressLoading, DisOpen, setDisOpen, profile } =
    useOrder();
  const addresses = previousAddressData?.address || [];
  const isMobile = useIsMobile();
  return (
    <div className="w-full   ">
      <div className="flex flex-row  md:pb-0 pb-5  justify-between w-full  md:items-center items-start">
        <div className="flex flex-col ">
          <p className="text-xl font-medium">Address</p>
          <p className="text-sm mb-5 text-muted-foreground font-medium">
            Please enter your address to continue
          </p>
        </div>
          {profile?.data?.address?.street && (
            <div className="flex flex-col items-end gap-2">
              <p className="text-sm md:block hidden text-muted-foreground font-medium">
                Alamat Profil (Profile Address)
              </p>
              <div className="flex items-center gap-3 bg-primary/5 p-3 rounded-xl border border-primary/20 w-max">
                <Switch 
                  id="use-profile-address" 
                  checked={form.watch("street") === profile.data.address.street}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const addr = profile.data.address;
                      form.setValue("street", addr.street || "");
                      form.setValue("city", addr.city || "");
                      form.setValue("country", addr.country || "Malaysia");
                      form.setValue("postalCode", addr.zip || "");
                      form.setValue("address", addr.state || "");
                    } else {
                      form.setValue("street", "");
                      form.setValue("city", "");
                      form.setValue("country", "Malaysia");
                      form.setValue("postalCode", "");
                      form.setValue("address", "");
                    }
                  }}
                />
                <label htmlFor="use-profile-address" className="text-sm font-semibold text-primary cursor-pointer">
                  Guna Alamat Profil
                </label>
              </div>
            </div>
          )}
      </div>
      <Form {...form}>
        <form
          ref={formRef}
          onSubmit={onFormSubmit}
          className="w-full grid md:grid-cols-2 gap-4"
        >
          <FormField
            control={control}
            name="customerName"
            render={({ field }) => (
              <FormGeneratorV2
                field={field}
                type="text"
                label="Full Name"
                placeholder="Enter your full name"
                inputType="input"
                errors={errors}
                Icon={FaUser}
                className={{
                  input: "w-full",
                }}
              />
            )}
          />
          <FormField
            control={control}
            name="address"
            render={({ field }) => (
              <FormGeneratorV2
                field={field}
                type="text"
                label="Address"
                placeholder="Enter your address"
                inputType="input"
                errors={errors}
                Icon={FaAddressCard}
                className={{
                  input: "w-full",
                }}
              />
            )}
          />
          <FormField
            control={control}
            name="city"
            render={({ field }) => (
              <FormGeneratorV2
                field={field}
                type="text"
                label="City"
                placeholder="Enter your city"
                inputType="input"
                errors={errors}
                Icon={FaMapLocationDot}
                className={{
                  input: "w-full",
                }}
              />
            )}
          />
          <FormField
            control={control}
            name="country"
            render={({ field }) => (
              <FormGeneratorV2
                field={field}
                type="text"
                label="Country"
                placeholder="Enter your country"
                inputType="input"
                errors={errors}
                Icon={IoEarthSharp}
                className={{
                  input: "w-full",
                }}
              />
            )}
          />
          <FormField
            control={control}
            name="postalCode"
            render={({ field }) => (
              <FormGeneratorV2
                field={field}
                type="text"
                label="Postal Code"
                placeholder="Enter your postal code"
                inputType="input"
                errors={errors}
                Icon={FaFlag}
                className={{
                  input: "w-full",
                }}
              />
            )}
          />
          <FormField
            control={control}
            name="street"
            render={({ field }) => (
              <FormGeneratorV2
                field={field}
                type="text"
                label="Street"
                placeholder="Enter your street"
                inputType="input"
                errors={errors}
                Icon={LuMapPinHouse}
                className={{
                  input: "w-full",
                }}
              />
            )}
          />
          <div className="md:col-span-2">
            <FormField
              control={control}
              name="orderNotes"
              render={({ field }) => (
                <FormGeneratorV2
                  field={field}
                  type="text"
                  label="Order Notes (Optional)"
                  placeholder="E.g. specific instructions for delivery or printing..."
                  inputType="textarea"
                  errors={errors}
                  Icon={FaStickyNote}
                  className={{
                    input: "w-full min-h-[80px]",
                  }}
                />
              )}
            />
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddressForm;
