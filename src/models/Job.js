import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  date_posted: {
    type: Date,
    required: true
  },
  date_created: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  organization: {
    type: String,
    required: true
  },
  organization_url: String,
  date_validthrough: Date,
  locations_raw: [{
    type: mongoose.Schema.Types.Mixed
  }],
  locations_alt_raw: [String],
  location_type: String,
  location_requirements_raw: [{
    type: mongoose.Schema.Types.Mixed
  }],
  salary_raw: mongoose.Schema.Types.Mixed,
  employment_type: [String],
  url: {
    type: String,
    required: true
  },
  source_type: String,
  source: String,
  source_domain: String,
  organization_logo: String,
  cities_derived: [String],
  regions_derived: [String],
  countries_derived: [String],
  locations_derived: [String],
  timezones_derived: [String],
  lats_derived: [Number],
  lngs_derived: [Number],
  remote_derived: Boolean,
  description_text: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Job', jobSchema); 