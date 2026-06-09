# Print the key statistics in R for cross-language comparison vs Python.
# Run from repo root:  micromamba run -p ~/rrenv Rscript analysis/r/validate.R
suppressMessages({library(boot); library(pwr)})

d <- read.csv("analysis/r/demo_deltas.csv")
delta <- d$delta
n <- length(delta)

cat("n", n, "\n")
cat("mean_delta", format(mean(delta), digits = 10), "\n")
cat("cohens_d", format(mean(delta) / sd(delta), digits = 10), "\n")

w <- wilcox.test(delta, mu = 0, exact = FALSE, correct = FALSE)
cat("wilcox_p", format(w$p.value, digits = 6), "\n")

set.seed(42)
bs <- boot(delta, function(x, i) mean(x[i]), R = 10000)
ci <- boot.ci(bs, type = "bca")
cat("bca_low", format(ci$bca[4], digits = 8), "bca_high", format(ci$bca[5], digits = 8), "\n")

m <- lm(delta ~ factor(cluster_id) + scale(desc_len), data = d)
cat("cuped_r2", format(summary(m)$r.squared, digits = 10), "\n")

k <- sum(delta > 0)
cat("bayes_k", k, "bayes_prob", format(1 - pbeta(0.5, 1 + k, 1 + n - k), digits = 6), "\n")

s2 <- var(delta); tau2 <- s2
ns <- seq_len(n); xbar <- cumsum(delta) / ns
lambda <- sqrt(s2 / (s2 + ns * tau2)) * exp((ns^2 * tau2 * xbar^2) / (2 * s2 * (s2 + ns * tau2)))
cat("msprt_p", format(min(cummin(pmin(1, 1 / lambda))), digits = 6), "\n")

cat("achieved_power",
    format(pwr.t.test(n = n, d = abs(mean(delta) / sd(delta)),
                      sig.level = 0.05, type = "one.sample")$power, digits = 8), "\n")
