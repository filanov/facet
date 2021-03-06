import React, { ReactChild } from 'react';
import Humanize from 'humanize-plus';
import {
  Flex,
  FlexItem,
  TextContent,
  TextList,
  TextListItem,
  TextListVariants,
  TextListItemVariants,
  Text,
  TextVariants,
  FlexModifiers,
} from '@patternfly/react-core';
import { Table, TableHeader, TableBody, TableVariant } from '@patternfly/react-table';
import { ExtraParamsType } from '@patternfly/react-table/dist/js/components/Table/base';
import { Inventory } from '../../api/types';
import { getHostRowHardwareInfo } from './hardwareInfo';
import { DASH } from '../constants';
import HostEvents from '../fetching/HostEvents';

import './HostRowDetail.css';

type HostDetailProps = {
  hostId: string;
  inventory: Inventory;
};

type HostDetailItemProps = {
  title: string;
  value?:
    | {
        title: string;
        value?: string;
      }[]
    | React.ReactNode;
};

type SectionTitleProps = {
  title: string;
};

type SectionColumnProps = {
  children: ReactChild | (ReactChild | undefined)[];
};

type DisksTableProps = {
  disks?: Inventory['disks'];
};

type NicsTableProps = {
  interfaces?: Inventory['interfaces'];
};

const HostDetailItem: React.FC<HostDetailItemProps> = ({ title, value = '' }) => {
  return (
    <>
      <Text component={TextVariants.h6} className="host-row-detail-item__title">
        {title}
      </Text>
      <div>
        {Array.isArray(value) ? (
          <TextList component={TextListVariants.dl}>
            {value.map((item) => [
              <TextListItem key={item.title} component={TextListItemVariants.dt}>
                {item.title}
              </TextListItem>,
              <TextListItem key={`dd-${item.title}`} component={TextListItemVariants.dd}>
                {item.value}
              </TextListItem>,
            ])}
          </TextList>
        ) : (
          value
        )}
      </div>
    </>
  );
};

const SectionTitle: React.FC<SectionTitleProps> = ({ title }) => (
  <FlexItem
    breakpointMods={[{ modifier: FlexModifiers['full-width'] }]}
    className="host-row-detail__section"
  >
    <TextContent>
      <Text component={TextVariants.h3}>{title}</Text>
    </TextContent>
  </FlexItem>
);

const SectionColumn: React.FC<SectionColumnProps> = ({ children }) => (
  <FlexItem breakpointMods={[{ modifier: FlexModifiers['grow'] }]}>
    <TextContent>{children}</TextContent>
  </FlexItem>
);

const diskColumns = [
  { title: 'Name' },
  { title: 'Drive type' },
  { title: 'Size' },
  { title: 'Serial' },
  // { title: 'Vendor' }, TODO(mlibra): search HW database for humanized values
  { title: 'Model' },
  { title: 'WWN' },
];

const diskRowKey = ({ rowData }: ExtraParamsType) => rowData?.name?.title;

const DisksTable: React.FC<DisksTableProps> = ({ disks = [] }) => {
  const rows = disks
    .sort((diskA, diskB) => diskA.name?.localeCompare(diskB.name || '') || 0)
    .map((disk) => ({
      cells: [
        disk.name,
        disk.driveType,
        Humanize.fileSize(disk.sizeBytes || 0),
        disk.serial,
        // disk.vendor, TODO(mlibra): search HW database for humanized values
        disk.model,
        disk.wwn,
      ],
    }));

  return (
    <Table
      rows={rows}
      cells={diskColumns}
      variant={TableVariant.compact}
      aria-label="Host's disks table"
      borders={false}
    >
      <TableHeader />
      <TableBody rowKey={diskRowKey} />
    </Table>
  );
};

const nicsColumns = [
  { title: 'Name' },
  { title: 'MAC address' },
  { title: 'IPv4 address' },
  { title: 'IPv6 address' },
  { title: 'Speed' },
  // { title: 'Vendor' }, TODO(mlibra): search HW database for humanized values
  // { title: 'Product' },
];

const nicsRowKey = ({ rowData }: ExtraParamsType) => rowData?.name?.title;

const NicsTable: React.FC<NicsTableProps> = ({ interfaces = [] }) => {
  const rows = interfaces
    .sort((nicA, nicB) => nicA.name?.localeCompare(nicB.name || '') || 0)
    .map((nic) => ({
      cells: [
        nic.name,
        nic.macAddress,
        (nic.ipv4Addresses || []).join(', '),
        (nic.ipv6Addresses || []).join(', '),
        `${nic.speedMbps ? `${nic.speedMbps} Mbps` : ''}`, // TODO(mlibra): do we need to change the unit?
        // nic.vendor, TODO(mlibra): search HW database for humanized values
        // nic.product,
      ],
    }));

  return (
    <Table
      rows={rows}
      cells={nicsColumns}
      variant={TableVariant.compact}
      aria-label="Host's network interfaces table"
      borders={false}
    >
      <TableHeader />
      <TableBody rowKey={nicsRowKey} />
    </Table>
  );
};

export const HostDetail: React.FC<HostDetailProps> = ({ hostId, inventory }) => {
  const rowInfo = getHostRowHardwareInfo(inventory);

  let bmcAddress = inventory.bmcAddress;
  if (inventory.bmcV6address) {
    bmcAddress = bmcAddress ? `${bmcAddress}, ${inventory.bmcV6address}` : inventory.bmcV6address;
  }
  bmcAddress = bmcAddress || DASH;

  return (
    <Flex className="host-row-detail">
      <SectionTitle title="Host Details" />
      <SectionColumn>
        <HostDetailItem title="Manufacturer" value={inventory.systemVendor?.manufacturer || DASH} />
        <HostDetailItem title="Product" value={inventory.systemVendor?.productName || DASH} />
        <HostDetailItem title="Serial number" value={rowInfo.serialNumber} />
      </SectionColumn>
      <SectionColumn>
        <HostDetailItem title="CPU architecture" value={inventory.cpu?.architecture || DASH} />
        <HostDetailItem title="CPU model name" value={inventory.cpu?.modelName || DASH} />
        <HostDetailItem title="CPU clock speed" value={rowInfo.cpuSpeed} />
      </SectionColumn>
      <SectionColumn>
        <HostDetailItem title="Memory capacity" value={rowInfo.memory.title} />
        <HostDetailItem title="BMC address" value={bmcAddress} />
        <HostDetailItem title="Boot mode" value={inventory.boot?.currentBootMode || DASH} />
        {inventory.boot?.pxeInterface && (
          <HostDetailItem title="PXE interface" value={inventory.boot?.pxeInterface} />
        )}
      </SectionColumn>

      <SectionTitle title={`${(inventory.disks || []).length} Disks`} />
      <SectionColumn>
        <DisksTable disks={inventory.disks} />
      </SectionColumn>

      <SectionTitle title={`${(inventory.interfaces || []).length} NICs`} />
      <SectionColumn>
        <NicsTable interfaces={inventory.interfaces} />
      </SectionColumn>

      {/* TODO(mlibra): will be placed somewhere else */}
      <SectionTitle title="Events" />
      <SectionColumn>
        <HostEvents entityId={hostId} />
      </SectionColumn>
    </Flex>
  );
};
