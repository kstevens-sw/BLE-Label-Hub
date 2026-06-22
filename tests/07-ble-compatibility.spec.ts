import { expect, test } from '@playwright/test';

test('selects the JD-468BT style FFE1 write characteristic', async ({ page }) => {
  // Given a generic thermal-printer BLE service exposing FFE1
  await page.goto('/');

  // When the transport searches its supported characteristic UUIDs
  const selectedUuid = await page.evaluate(async () => {
    const { BLETransport } = await import('/ble.js');
    const transport = new BLETransport();
    const characteristics = [
      {
        uuid: '0000ffe1-0000-1000-8000-00805f9b34fb',
        properties: { write: true, writeWithoutResponse: true, notify: true },
      },
    ];

    return transport.findCharacteristic(characteristics, [0xffe1])?.uuid ?? null;
  });

  // Then the FFE1 characteristic is selected
  expect(selectedUuid).toBe('0000ffe1-0000-1000-8000-00805f9b34fb');
});
