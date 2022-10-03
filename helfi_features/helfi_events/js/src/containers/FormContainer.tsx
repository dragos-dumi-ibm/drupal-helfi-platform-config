import React, { FormEvent, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import LocationFilter from '../components/LocationFilter';
import type Location from '../types/Location';
import { QueryBuilder } from '../utils/QueryBuilder';
import ApiKeys from '../enum/ApiKeys';
import SubmitButton from '../components/SubmitButton';
import DateSelect from '../components/DateSelect';
import CheckboxFilter from '../components/CheckboxFilter';
import type FilterSettings from '../types/FilterSettings';
import HDS_DATE_FORMAT from '../utils/HDS_DATE_FORMAT';


// TODO: Please use ISO standard date format for all date parsing in frontend AND backend.
// Formatting to userland format should be done in the view from ISO stardard date string or reliably parsed date object 
// https://www.iso.org/iso-8601-date-and-time-format.html

// This somewhat handles date parsing and validation in custom UI format but is subject to parse errors.
const getDateTimeFromHDSFormat = (d: string): DateTime => DateTime.fromFormat(d, HDS_DATE_FORMAT, { locale: 'fi' });

// End date must be after start date. But only if both are defined.
const isOutOfRange = ({ endDate, startDate }: { endDate: DateTime | undefined, startDate: DateTime | undefined }): boolean => !!(startDate && endDate && startDate.startOf("day") >= endDate.startOf("day"))

// Date must be in within the next 1000 years or so....
// This also validates that the string is not too long even though it might be valid.
const INVALID_DATE = (dt: DateTime | undefined): boolean => {
  if (!dt) { return false }
  return (!dt.isValid || dt.year > 9999)
}

type FormErrors = {
  invalidEndDate: boolean,
  invalidStartDate: boolean,
  // outOfRange: boolean
}

const FormContainer = ({ filterSettings, queryBuilder, onSubmit, loading, locationOptions }: {
  filterSettings: FilterSettings,
  queryBuilder: QueryBuilder,
  onSubmit: Function,
  loading: boolean,
  locationOptions: Location[],
}) => {
  const [endDisabled, disableEnd] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<DateTime>();
  const [endDate, setEndDate] = useState<DateTime>();
  const [freeFilter, setFreeFilter] = useState<boolean>(false);
  const [remoteFilter, setRemoteFilter] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({
    invalidEndDate: false,
    invalidStartDate: false,
    // outOfRange: false
  })

  const setStart = (d: string) => {
    const start = getDateTimeFromHDSFormat(d);
    if (INVALID_DATE(start)) {
      console.warn('invalid start date', { start, endDate })
      if (d.length === 0) {
        setStartDate(undefined);
        setErrors({ ...errors, invalidStartDate: false })
      } else {
        setErrors({ ...errors, invalidStartDate: true })

      }
    } else {
      if (isOutOfRange({ startDate: start, endDate })) {
        console.warn('selected start date is out of range with end date, setting end date to next day after start date')
        setEndDate(start?.plus({ 'days': 1 }))
      }
      setStartDate(start);
      setErrors({ ...errors, invalidStartDate: false })
    }
  }

  const setEnd = (d: string) => {

    const end = getDateTimeFromHDSFormat(d);
    if (INVALID_DATE(end)) {
      console.warn('invalid end date', { end, d })
      if (d.length === 0) {
        setErrors({ ...errors, invalidEndDate: false })
        setEndDate(undefined);
      } else {
        setErrors({ ...errors, invalidEndDate: true })
      }
    } else {

      if (isOutOfRange({ startDate, endDate: end })) {
        console.warn('selected end date is out of range, setting end date to next day after start date')
        setEndDate(startDate?.plus({ 'days': 1 }))
      } else {
        setEndDate(end);
      }
      setErrors({ ...errors, invalidEndDate: false })
    }

  }

  useEffect(() => {
    const setDate = (key: string, date: DateTime | undefined) => {
      if (!date || !date.isValid) {
        queryBuilder.resetParam(key);
        return;
      }
      if (date.isValid) {
        queryBuilder.setParams({ [key]: date.toISODate() });
      } else {
        console.warn('invalid date given to setDate', { date })
        return;
      }
    }

    setDate(ApiKeys.START, startDate);

    if (endDisabled) {
      setDate(ApiKeys.END, startDate);
    }
    
    if (!endDisabled) {
      setDate(ApiKeys.END, endDate);
    }

  }, [startDate, endDate, endDisabled, queryBuilder])

  const toggleFreeEvents = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event?.target?.checked;

    if (!checked) {
      setFreeFilter(false);
      queryBuilder.resetParam(ApiKeys.FREE);
      return;
    }

    setFreeFilter(true);
    queryBuilder.setParams({ [ApiKeys.FREE]: 'true' })
  }

  const toggleRemoteEvents = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event?.target?.checked) {
      setRemoteFilter(false);
      queryBuilder.resetParam(ApiKeys.REMOTE);

      return;
    }

    setRemoteFilter(true);
    queryBuilder.setParams({ [ApiKeys.REMOTE]: 'true' })
  }
  const handleDisableEnd = () => {
    disableEnd(!endDisabled);
    setErrors({ ...errors, invalidEndDate: false })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(); return false;
  }

  const bothCheckboxes = filterSettings.showFreeFilter && filterSettings.showRemoteFilter;
  const showOnlyLabel = Drupal.t('Show only');
  const freeTranslation = Drupal.t('Free events');
  const remoteTranslation = Drupal.t('Remote events');
  const freeLabel = bothCheckboxes ? freeTranslation : `${showOnlyLabel} ${freeTranslation.toLowerCase()}`;
  const remoteLabel = bothCheckboxes ? remoteTranslation : `${showOnlyLabel} ${remoteTranslation.toLowerCase()}`;


  return (
    <form className='event-form-container' onSubmit={handleSubmit}>
      <h3>{Drupal.t('Filter events')}</h3>
      <div className='event-form__filters-container'>
        <div className='event-form__filter-section-container'>
          {
            filterSettings.showLocation &&
            <LocationFilter loading={loading} options={locationOptions} queryBuilder={queryBuilder} />
          }
          {
            filterSettings.showTimeFilter &&
            <DateSelect
              endDate={endDate}
              invalidEndDate={errors.invalidEndDate}
              invalidStartDate={errors.invalidStartDate}
              endDisabled={endDisabled}
              disableEnd={handleDisableEnd}
              queryBuilder={queryBuilder}
              setEndDate={setEnd}
              setStartDate={setStart}
              startDate={startDate}
              // outOfRangeError={errors.outOfRange}
            />
          }
        </div>
        {
          bothCheckboxes &&
          <div className='event-form__checkboxes-label'>{Drupal.t('Show only')}</div>
        }
        <div className='event-form__filter-section-container'>
          {
            filterSettings.showFreeFilter &&
            <CheckboxFilter
              checked={freeFilter}
              id='free-toggle'
              label={freeLabel}
              onChange={toggleFreeEvents}
            />
          }
          {
            filterSettings.showRemoteFilter &&
            <CheckboxFilter
              checked={remoteFilter}
              id='remote-toggle'
              label={remoteLabel}
              onChange={toggleRemoteEvents}
            />
          }
        </div>
        <SubmitButton disabled={errors.invalidEndDate || errors.invalidStartDate} />
      </div>
    </form>
  )
}

export default FormContainer;
