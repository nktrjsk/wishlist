<script lang="ts">
    import { Combobox, Portal, useListCollection, type ComboboxRootProps } from "@skeletonlabs/skeleton-svelte";

    interface Props {
        value?: string;
        name: string;
        id: string;
        disabled?: boolean;
    }

    let { value = $bindable("USD"), name, id, disabled = false }: Props = $props();

    const availableCurrencies = Intl.supportedValuesOf("currency");

    let items = $state(availableCurrencies);
    const currenciesCollection = $derived(
        useListCollection({
            items
        })
    );

    const onInputValueChange: ComboboxRootProps["onInputValueChange"] = (event) => {
        const filtered = availableCurrencies.filter((item) => item.includes(event.inputValue.toLocaleUpperCase()));
        items = filtered;
    };
</script>

<Combobox
    alwaysSubmitOnEnter={false}
    collection={currenciesCollection}
    data-testid="currency-select"
    {disabled}
    inputBehavior="autohighlight"
    {onInputValueChange}
    onOpenChange={() => (items = availableCurrencies)}
    onValueChange={(e) => (value = e.value[0])}
    openOnClick
    required
    value={[value]}
>
    <Combobox.Control>
        <Combobox.Input>
            {#snippet element(props)}
                <input {...props} class="input uppercase" />
            {/snippet}
        </Combobox.Input>
        <Combobox.Trigger class="bg-transparent" />
    </Combobox.Control>
    <Portal>
        <Combobox.Positioner>
            <Combobox.Content class="max-h-80 overflow-auto">
                {#each items as item (item)}
                    <Combobox.Item {item}>
                        <Combobox.ItemText>{item}</Combobox.ItemText>
                        <Combobox.ItemIndicator />
                    </Combobox.Item>
                {:else}
                    <span>No currencies available.</span>
                {/each}
            </Combobox.Content>
        </Combobox.Positioner>
    </Portal>
</Combobox>

<input {id} {name} {disabled} type="hidden" bind:value />
