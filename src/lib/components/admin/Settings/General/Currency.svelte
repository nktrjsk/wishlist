<script lang="ts">
    import SettingsGroup from "../SettingsGroup.svelte";
    import Setting from "../Setting.svelte";
    import CurrencySelect from "$lib/components/CurrencySelect.svelte";
    import { getFormatter } from "$lib/i18n";

    interface Props {
        config: Pick<Config, "defaultCurrency">;
    }

    const { config }: Props = $props();
    const t = getFormatter();
</script>

<SettingsGroup title={$t("admin.default-currency")}>
    <Setting>
        <label class="label flex flex-col" for="defaultCurrency">
            <span>{$t("admin.default-currency")}</span>
            <CurrencySelect id="defaultCurrency" name="defaultCurrency" value={config.defaultCurrency} />
        </label>
    </Setting>
</SettingsGroup>
